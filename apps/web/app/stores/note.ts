import { skipHydrate } from 'pinia'
import { noteStatus, noteVisibility } from '#shared/types/note'
import { localKeys } from '~/utils/local-cache'
import { toEpoch } from '~/utils/time'
import type {
	CreateNoteInput,
	ListNotesResponse,
	NoteListItem,
	NoteStatus,
	NoteWithTags,
	UpdateNoteBody,
} from '#shared/types/note'
import type { ViewFilter } from '#shared/types/view'
import { newId } from '#shared/utils/id'

type NoteVisibilityValue = (typeof noteVisibility)[keyof typeof noteVisibility]
type NoteStatusValue = (typeof noteStatus)[keyof typeof noteStatus]

interface OutboxPayload {
	content: string
	spaceId: string | null
	tagNames?: string[]
	visibility: NoteVisibilityValue
	status: NoteStatusValue
}

type OutboxState = 'pending' | 'syncing' | 'failed'

interface OutboxRow {
	noteId: string
	kind: 'create' | 'update'
	payload: OutboxPayload
	updatedAt: number
	state: OutboxState
	attempts: number
	nextRetryAt: number
	lastError?: string
	lastStatus?: number
}

const MAX_ATTEMPTS = 8
const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 60_000
const PAGE_SIZE = 20
const OUTBOX_CONCURRENCY = 4

function statusOf(error: unknown) {
	if (error && typeof error === 'object' && 'statusCode' in error) {
		const { statusCode } = error as { statusCode?: unknown }
		if (typeof statusCode === 'number') return statusCode
	}
	return 0
}

function backoffDelay(attempts: number) {
	const exponential = Math.min(RETRY_BASE_MS * 2 ** attempts, RETRY_MAX_MS)
	return Math.round(exponential * (0.5 + Math.random() * 0.5))
}

function compareNotes(a: NoteListItem, b: NoteListItem) {
	const pinned = Number(b.status === noteStatus.pinned) - Number(a.status === noteStatus.pinned)
	if (pinned) return pinned
	const byTime = toEpoch(b.createdAt) - toEpoch(a.createdAt)
	if (byTime) return byTime
	return a.id < b.id ? 1 : a.id > b.id ? -1 : 0
}

export const useNoteStore = defineStore('note', () => {
	const authClient = useAuth()
	const session = authClient.useSession()
	const spaceStore = useSpaceStore()
	const tagStore = useTagStore()
	const online = useOnline()

	const viewStore = useViewStore()

	const keyword = ref('')
	const debouncedKeyword = refDebounced(keyword, 400)
	const visibilityFilter = ref<NoteVisibilityValue[]>([])
	const tagFilter = ref<string[]>([])
	const pinnedOnly = ref(false)

	const activeFilter = computed<ViewFilter>(() => {
		const base = viewStore.baseFilter
		const q = debouncedKeyword.value.trim()
		return {
			...base,
			...(q && { q }),
			...(visibilityFilter.value.length && { visibility: visibilityFilter.value }),
			...(tagFilter.value.length && {
				tagIds: [...new Set([...(base.tagIds ?? []), ...tagFilter.value])],
			}),
			...(pinnedOnly.value && { pinnedOnly: true }),
		}
	})

	const visibleNotes = computed(() => {
		const q = keyword.value.trim().toLowerCase()
		const scope = activeFilter.value
		return notes.value
			.filter((note) => {
				if (note.status === noteStatus.archived) return false
				if (q && !note.content.toLowerCase().includes(q)) return false
				if (scope.spaceId !== undefined && note.spaceId !== scope.spaceId) return false
				if (scope.tagIds?.length) {
					const tags = note.tagIds ?? []
					if (!scope.tagIds.every((id) => tags.includes(id))) return false
				}
				if (scope.visibility?.length && !scope.visibility.includes(note.visibility)) return false
				if (scope.pinnedOnly && note.status !== noteStatus.pinned) return false
				return true
			})
			.sort(compareNotes)
	})

	function resetFilter() {
		keyword.value = ''
		visibilityFilter.value = []
		tagFilter.value = []
		pinnedOnly.value = false
	}

	const notes = skipHydrate(useLocalStorage<NoteListItem[]>(localKeys.notes, []))
	const outbox = skipHydrate(useLocalStorage<OutboxRow[]>(localKeys.outbox, []))
	const nextCursor = skipHydrate(useLocalStorage<string | null>(localKeys.notesCursor, null))
	const pending = ref(false)
	const syncing = ref(false)
	const paginationDone = ref(false)
	let started = false

	const unsyncedIds = computed(() => {
		if (!online.value) return new Set(outbox.value.map((row) => row.noteId))
		return new Set(
			outbox.value
				.filter((row) => row.attempts > 0 || row.state === 'failed')
				.map((row) => row.noteId),
		)
	})

	function indexOf(id: string) {
		return notes.value.findIndex((note) => note.id === id)
	}

	function spaceNameOf(spaceId: string | null) {
		if (!spaceId) return null
		return spaceStore.spaces.find((space) => space.id === spaceId)?.name ?? null
	}

	function resolvedTagIds(tagNames?: string[]): string[] {
		if (!tagNames?.length) return []
		const byName = new Map(tagStore.tags.map((tag) => [tag.name.toLowerCase(), tag.id]))
		return tagNames
			.map((name) => byName.get(name.toLowerCase()))
			.filter((id): id is string => id !== undefined)
	}

	function mergeIncoming(incoming: NoteListItem[]) {
		if (!incoming.length) return
		const byId = new Map(notes.value.map((note) => [note.id, note]))
		let changed = false
		for (const note of incoming) {
			if (note.status === noteStatus.archived) continue
			const local = byId.get(note.id)
			if (local && toEpoch(local.updatedAt) > toEpoch(note.updatedAt)) continue
			byId.set(note.id, note)
			changed = true
		}
		if (!changed) return
		notes.value = [...byId.values()].sort(compareNotes)
	}

	// A space rename never bumps the notes' updatedAt, so cached names would go
	// stale. Skipped while spaces are empty so offline use keeps them.
	watch(
		() => spaceStore.spaces,
		() => {
			if (!spaceStore.spaces.length) return
			notes.value = notes.value.map((note) => {
				const spaceName = spaceNameOf(note.spaceId)
				return spaceName === note.spaceName ? note : { ...note, spaceName }
			})
		},
	)

	function enqueue(row: OutboxRow) {
		outbox.value = [...outbox.value.filter((item) => item.noteId !== row.noteId), row]
	}

	function enqueueFor(note: NoteListItem, kind: OutboxRow['kind'], tagNames?: string[]) {
		enqueue({
			noteId: note.id,
			kind,
			payload: {
				content: note.content,
				spaceId: note.spaceId,
				...(tagNames ? { tagNames } : {}),
				visibility: note.visibility,
				status: note.status,
			},
			updatedAt: toEpoch(note.updatedAt),
			state: 'pending',
			attempts: 0,
			nextRetryAt: 0,
		})
	}

	function settle(noteId: string) {
		outbox.value = outbox.value.filter((row) => row.noteId !== noteId)
	}

	async function push(row: OutboxRow) {
		const body = {
			content: row.payload.content,
			spaceId: row.payload.spaceId,
			...(row.payload.tagNames ? { tagNames: row.payload.tagNames } : {}),
			visibility: row.payload.visibility,
			status: row.payload.status,
			updatedAt: row.updatedAt,
		}
		if (row.kind === 'create') {
			await $fetch<NoteWithTags>('/api/notes', {
				method: 'POST',
				body: { id: row.noteId, ...body },
			})
			return
		}
		const winner = await $fetch<NoteWithTags>(`/api/notes/${row.noteId}`, { method: 'PATCH', body })
		const author = session.value.data?.user
		mergeIncoming([
			{
				...winner,
				spaceName: spaceNameOf(winner.spaceId),
				authorName: author?.name ?? null,
				authorImage: author?.image ?? null,
			},
		])
	}

	async function flush() {
		if (syncing.value || !online.value) return
		const now = Date.now()
		const due = outbox.value.filter((row) => row.state !== 'failed' && row.nextRetryAt <= now)
		if (!due.length) return

		syncing.value = true
		let rejected: unknown
		try {
			for (let start = 0; start < due.length; start += OUTBOX_CONCURRENCY) {
				const batch = due.slice(start, start + OUTBOX_CONCURRENCY)
				const results = await Promise.all(
					batch.map(async (row) => {
						try {
							await push(row)
							return { row, ok: true as const }
						} catch (error) {
							return { row, ok: false as const, error }
						}
					}),
				)
				for (const outcome of results) {
					if (outcome.ok) {
						settle(outcome.row.noteId)
						continue
					}
					const status = statusOf(outcome.error)
					if (status >= 400 && status < 500) {
						outbox.value = outbox.value.map((item) =>
							item.noteId === outcome.row.noteId
								? {
										...item,
										state: 'failed' as const,
										attempts: item.attempts + 1,
										nextRetryAt: Date.now() + RETRY_MAX_MS,
										lastError:
											outcome.error instanceof Error
												? outcome.error.message
												: String(outcome.error),
										lastStatus: status,
									}
								: item,
						)
						rejected ??= outcome.error
						continue
					}
					const attempts = outcome.row.attempts + 1
					outbox.value = outbox.value.map((item) =>
						item.noteId === outcome.row.noteId
							? {
									...item,
									state: attempts >= MAX_ATTEMPTS ? ('failed' as const) : ('pending' as const),
									attempts,
									nextRetryAt: Date.now() + backoffDelay(attempts),
									lastError:
										outcome.error instanceof Error ? outcome.error.message : String(outcome.error),
								}
							: item,
					)
				}
			}
		} finally {
			syncing.value = false
		}
		return rejected
	}

	async function loadMore() {
		if (pending.value || !online.value) return
		if (paginationDone.value) return
		const filter = activeFilter.value
		const spaceId = filter.spaceId === undefined ? undefined : (filter.spaceId ?? null)
		pending.value = true
		const data = await $fetch<ListNotesResponse>('/api/notes', {
			query: {
				limit: PAGE_SIZE,
				...(nextCursor.value ? { cursor: nextCursor.value } : {}),
				...(spaceId === null ? { noSpace: true } : spaceId ? { spaceId } : {}),
				...(filter.tagIds?.length ? { tagIds: filter.tagIds } : {}),
				...(filter.visibility?.length ? { visibility: filter.visibility } : {}),
				...(filter.pinnedOnly ? { pinnedOnly: true } : {}),
				...(filter.q ? { q: filter.q } : {}),
			},
		}).catch(() => null)
		if (data) {
			mergeIncoming(data.items)
			nextCursor.value = data.nextCursor
			if (data.nextCursor === null) paginationDone.value = true
		}
		pending.value = false
	}

	watch(
		() =>
			[
				session.value.isPending ? undefined : (session.value.data?.user?.id ?? 'anonymous'),
			] as const,
		(key, previous) => {
			if (import.meta.server || key === previous) return
			nextCursor.value = null
			paginationDone.value = false
			void loadMore()
		},
		{ immediate: true },
	)

	watch(
		() => JSON.stringify(activeFilter.value),
		() => {
			if (import.meta.server) return
			nextCursor.value = null
			paginationDone.value = false
			void loadMore()
		},
	)

	async function retryNote(id: string) {
		const row = outbox.value.find((item) => item.noteId === id)
		if (!row) return
		const recreate = row.kind === 'update' && row.lastStatus === 404
		outbox.value = outbox.value.map((item) =>
			item.noteId === id
				? {
						...item,
						kind: recreate ? ('create' as const) : item.kind,
						state: 'pending' as const,
						attempts: 0,
						nextRetryAt: 0,
						lastError: undefined,
						lastStatus: undefined,
					}
				: item,
		)
		await flush()
	}

	async function create(input: CreateNoteInput) {
		const now = new Date()
		const spaceId = input.spaceId ?? null
		const author = session.value.data?.user
		const note: NoteListItem = {
			id: newId(),
			userId: author?.id ?? '',
			content: input.content,
			spaceId,
			spaceName: spaceNameOf(spaceId),
			authorName: author?.name ?? null,
			authorImage: author?.image ?? null,
			tagIds: resolvedTagIds(input.tagNames),
			visibility: input.visibility ?? noteVisibility.private,
			status: input.status ?? noteStatus.normal,
			createdAt: now,
			updatedAt: now,
		}
		notes.value = [note, ...notes.value]
		enqueueFor(note, 'create', input.tagNames)
		const rejected = await flush()
		if (rejected) throw rejected
		return note
	}

	async function update(id: string, body: UpdateNoteBody) {
		const index = indexOf(id)
		const previous = notes.value[index]
		if (!previous) throw new Error(`Cannot update unknown note ${id}`)

		const next: NoteListItem = {
			...previous,
			content: body.content ?? previous.content,
			spaceId: body.spaceId === undefined ? previous.spaceId : body.spaceId,
			spaceName: body.spaceId === undefined ? previous.spaceName : spaceNameOf(body.spaceId),
			tagIds: body.tagNames ? resolvedTagIds(body.tagNames) : previous.tagIds,
			visibility: body.visibility ?? previous.visibility,
			status: body.status ?? previous.status,
			updatedAt: new Date(),
		}
		notes.value[index] = next

		enqueueFor(next, 'update', body.tagNames)
		const rejected = await flush()
		if (rejected) throw rejected
		return next
	}

	function setStatus(id: string, status: NoteStatus) {
		return update(id, { status })
	}

	function remove(id: string) {
		const index = indexOf(id)
		const previous = notes.value[index]
		if (!previous) return
		notes.value.splice(index, 1)
		enqueueFor({ ...previous, status: noteStatus.archived, updatedAt: new Date() }, 'update')
		void flush()
	}

	function isPending(id: string) {
		return unsyncedIds.value.has(id)
	}

	function start() {
		if (import.meta.server || started) return
		started = true
		useEventListener(window, 'online', () => void flush())
	}

	return {
		notes,
		visibleNotes,
		keyword,
		visibilityFilter,
		tagFilter,
		pinnedOnly,
		activeFilter,
		pending,
		syncing,
		resetFilter,
		loadMore,
		start,
		flush,
		retryNote,
		isPending,
		create,
		update,
		setStatus,
		remove,
	}
})
