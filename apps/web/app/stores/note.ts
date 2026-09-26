import { skipHydrate } from 'pinia'
import { noteStatus, noteVisibility } from '#shared/types/note'
import { localKeys } from '../utils/local-cache'
import { toEpoch } from '../utils/time'
import type {
	CreateNoteInput,
	ListNotesResponse,
	Note,
	NoteListItem,
	NoteStatus,
	UpdateNoteBody,
} from '#shared/types/note'
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
}

const MAX_ATTEMPTS = 8
const RETRY_BASE_MS = 2000
const RETRY_MAX_MS = 60_000
const PAGE_SIZE = 20

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

export const useNoteStore = defineStore('note', () => {
	const authClient = useAuth()
	const session = authClient.useSession()
	const spaceStore = useSpaceStore()
	const online = useOnline()

	// The timeline renders from this cache. skipHydrate, or Pinia hydrates the
	// empty SSR default over it on every page load.
	const notes = skipHydrate(useLocalStorage<NoteListItem[]>(localKeys.notes, []))
	const outbox = skipHydrate(useLocalStorage<OutboxRow[]>(localKeys.outbox, []))
	const nextCursor = skipHydrate(useLocalStorage<string | null>(localKeys.notesCursor, null))
	const pending = ref(false)
	const syncing = ref(false)
	const paginationDone = ref(false)
	let started = false

	// Only a write that has not landed is worth a badge; mere row presence flashed
	// on every successful online write.
	const unsyncedIds = computed(() => {
		const rows = online.value ? outbox.value.filter((row) => row.state === 'failed') : outbox.value
		return new Set(rows.map((row) => row.noteId))
	})

	function indexOf(id: string) {
		return notes.value.findIndex((note) => note.id === id)
	}

	function spaceNameOf(spaceId: string | null) {
		if (!spaceId) return null
		return spaceStore.spaces.find((space) => space.id === spaceId)?.name ?? null
	}

	function mergeIncoming(incoming: NoteListItem[]) {
		if (!incoming.length) return
		const byId = new Map(notes.value.map((note) => [note.id, note]))
		let changed = false
		for (const note of incoming) {
			if (note.status === noteStatus.archived) continue
			const local = byId.get(note.id)
			if (local && toEpoch(local.updatedAt) >= toEpoch(note.updatedAt)) continue
			byId.set(note.id, note)
			changed = true
		}
		if (!changed) return
		notes.value = [...byId.values()].sort((a, b) => toEpoch(b.createdAt) - toEpoch(a.createdAt))
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

	// One row per note: a newer local edit replaces the queued one.
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

	// A client-minted id makes POST retryable; PATCH carries last-write-wins.
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
			await $fetch<Note>('/api/notes', { method: 'POST', body: { id: row.noteId, ...body } })
			return
		}
		// PATCH returns the winning row, so a write that lost still converges.
		const winner = await $fetch<Note>(`/api/notes/${row.noteId}`, { method: 'PATCH', body })
		mergeIncoming([{ ...winner, spaceName: spaceNameOf(winner.spaceId) }])
	}

	async function flush() {
		if (syncing.value || !online.value) return
		const now = Date.now()
		const due = outbox.value.filter((row) => row.state !== 'failed' && row.nextRetryAt <= now)
		if (!due.length) return

		syncing.value = true
		for (const row of due) {
			try {
				await push(row)
				settle(row.noteId)
			} catch (error) {
				// 4xx will never succeed, so drop the intent; 5xx and network back off.
				const status = statusOf(error)
				if (status >= 400 && status < 500) {
					settle(row.noteId)
					continue
				}
				const attempts = row.attempts + 1
				outbox.value = outbox.value.map((item) =>
					item.noteId === row.noteId
						? {
								...item,
								state: attempts >= MAX_ATTEMPTS ? ('failed' as const) : ('pending' as const),
								attempts,
								nextRetryAt: Date.now() + backoffDelay(attempts),
								lastError: error instanceof Error ? error.message : String(error),
							}
						: item,
				)
			}
		}
		syncing.value = false
	}

	async function loadMore() {
		if (pending.value || !online.value) return
		if (paginationDone.value) return
		pending.value = true
		try {
			const data = await $fetch<ListNotesResponse>('/api/notes', {
				query: { limit: PAGE_SIZE, ...(nextCursor.value ? { cursor: nextCursor.value } : {}) },
			})
			mergeIncoming(data.items)
			nextCursor.value = data.nextCursor
			if (data.nextCursor === null) paginationDone.value = true
		} catch {
			// keep the cache
		} finally {
			pending.value = false
		}
	}

	async function retryNote(id: string) {
		if (!outbox.value.some((row) => row.noteId === id)) return
		outbox.value = outbox.value.map((row) =>
			row.noteId === id ? { ...row, state: 'pending' as const, attempts: 0, nextRetryAt: 0 } : row,
		)
		await flush()
	}

	async function create(input: CreateNoteInput) {
		const now = new Date()
		const spaceId = input.spaceId ?? null
		const note: NoteListItem = {
			id: newId(),
			userId: session.value.data?.user?.id ?? '',
			content: input.content,
			spaceId,
			spaceName: spaceNameOf(spaceId),
			visibility: input.visibility ?? noteVisibility.private,
			status: input.status ?? noteStatus.normal,
			createdAt: now,
			updatedAt: now,
		}
		notes.value = [note, ...notes.value]
		enqueueFor(note, 'create', input.tagNames)
		await flush()
		return note
	}

	async function update(id: string, body: UpdateNoteBody) {
		const index = indexOf(id)
		const previous = notes.value[index]
		// Returning quietly would drop the user's edit: the cache can lose a note
		// to a concurrent archive while the editor is open.
		if (!previous) throw new Error(`Cannot update unknown note ${id}`)
		const next: NoteListItem = {
			...previous,
			content: body.content ?? previous.content,
			spaceId: body.spaceId === undefined ? previous.spaceId : body.spaceId,
			spaceName: body.spaceId === undefined ? previous.spaceName : spaceNameOf(body.spaceId),
			status: body.status ?? previous.status,
			updatedAt: new Date(),
		}
		notes.value[index] = next
		enqueueFor(next, 'update', body.tagNames)
		await flush()
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

	// App-lifetime on purpose, so it outlives the calling component. No polling:
	// a timer would spend D1 reads on every tick to find nothing to do.
	function start() {
		if (import.meta.server || started) return
		started = true
		void loadMore()
		useEventListener(window, 'online', () => void flush())
	}

	return {
		notes,
		pending,
		syncing,
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
