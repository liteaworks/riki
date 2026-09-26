import { skipHydrate } from 'pinia'
import { chunk } from '#shared/utils/chunk'
import { noteStatus, noteVisibility, syncNotesBodySchema } from '#shared/types/note'
import { messageOf } from '../utils/failure-toast'
import { localKeys } from '../utils/local-cache'
import { toEpoch } from '../utils/time'
import type {
	CreateNoteInput,
	ListNotesResponse,
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
const SYNC_INTERVAL_MS = 15_000
const PAGE_SIZE = 20
const PULL_LIMIT = 50
// Must not exceed the server's `syncNotesBodySchema` cap.
const SYNC_BATCH = 50

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

function toSyncBody(rows: OutboxRow[]) {
	return syncNotesBodySchema.parse({
		notes: rows.map((row) => ({
			id: row.noteId,
			content: row.payload.content,
			spaceId: row.payload.spaceId,
			...(row.payload.tagNames ? { tagNames: row.payload.tagNames } : {}),
			visibility: row.payload.visibility,
			status: row.payload.status,
			updatedAt: row.updatedAt,
		})),
	})
}

export const useNoteStore = defineStore('note', () => {
	const authClient = useAuth()
	const session = authClient.useSession()
	const spaceStore = useSpaceStore()
	const online = useOnline()

	// The timeline renders from this cache, so it stays readable with no network.
	// skipHydrate is required: without it Pinia hydrates these refs from the SSR
	// payload (which holds the empty server-side default) and the localStorage
	// copy is discarded on every page load.
	const notes = skipHydrate(useLocalStorage<NoteListItem[]>(localKeys.notes, []))
	const outbox = skipHydrate(useLocalStorage<OutboxRow[]>(localKeys.outbox, []))
	const nextCursor = skipHydrate(useLocalStorage<string | null>(localKeys.notesCursor, null))
	const pending = ref(false)
	const syncing = ref(false)
	const paginationDone = ref(false)
	let started = false

	// Highest `updatedAt` the client has already reconciled; lets the periodic pull
	// ask for a delta instead of re-reading the newest page every time.
	let syncPoint = 0

	// Shows only when the write has not landed: queued while offline, or failed.
	// Keying on mere row presence made the badge flash on every online write.
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

	// Strictly-newer-wins, so replaying a pull can never undo a local edit.
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

	// A space rename never bumps the notes' `updatedAt`, so a cached `spaceName`
	// would stay stale through every pull. Re-derive it when spaces are known;
	// skipped while empty so offline use keeps the cached labels.
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

	// One row per note: a newer local edit replaces whatever was still queued.
	function enqueue(row: OutboxRow) {
		outbox.value = [...outbox.value.filter((item) => item.noteId !== row.noteId), row]
	}

	function enqueueFor(note: NoteListItem, tagNames?: string[]) {
		enqueue({
			noteId: note.id,
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

	async function flush() {
		if (syncing.value || !online.value) return
		const now = Date.now()
		const due = outbox.value.filter((row) => row.state !== 'failed' && row.nextRetryAt <= now)
		if (!due.length) return

		syncing.value = true
		const claimed = new Set(due.map((row) => row.noteId))
		outbox.value = outbox.value.map((row) =>
			claimed.has(row.noteId) ? { ...row, state: 'syncing' } : row,
		)
		try {
			for (const group of chunk(due, SYNC_BATCH)) {
				const response = await $fetch<{ applied: string[]; rejected: string[] }>('/api/sync', {
					method: 'POST',
					body: toSyncBody(group),
				})
				// Rejected ids belong to another user: drop them instead of retrying forever.
				const settled = new Set([...response.applied, ...response.rejected])
				outbox.value = outbox.value.filter((row) => !settled.has(row.noteId))
			}
		} catch (error) {
			// A 4xx will never succeed on retry, so it fails permanently instead of
			// burning eight attempts and a batch of backoff.
			const permanent = statusOf(error) >= 400 && statusOf(error) < 500
			outbox.value = outbox.value.map((row) => {
				if (row.state !== 'syncing') return row
				const attempts = row.attempts + 1
				return {
					...row,
					state: permanent || attempts >= MAX_ATTEMPTS ? ('failed' as const) : ('pending' as const),
					attempts,
					nextRetryAt: Date.now() + backoffDelay(attempts),
					lastError: messageOf(error),
				}
			})
		} finally {
			syncing.value = false
		}
	}

	async function pull() {
		if (!online.value) return
		try {
			const data = await $fetch<{ items: NoteListItem[] }>('/api/notes', {
				query: { limit: PULL_LIMIT, ...(syncPoint ? { since: syncPoint } : {}) },
			})
			mergeIncoming(data.items)
			// Only advance past a delta we know is complete, otherwise a truncated
			// page would silently skip the rows that did not fit.
			if (data.items.length < PULL_LIMIT) {
				syncPoint = data.items.reduce(
					(max, note) => Math.max(max, toEpoch(note.updatedAt)),
					syncPoint,
				)
			}
		} catch {
			// keep the cache
		}
	}

	async function loadMore() {
		if (pending.value || !online.value) return
		// `pull` fills the cache without touching the cursor, so "no cursor" alone
		// cannot mean "exhausted" or paging would stop at the first page.
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

	async function sync() {
		await flush()
		await pull()
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
		enqueueFor(note, input.tagNames)
		await flush()
		return note
	}

	async function update(id: string, body: UpdateNoteBody) {
		const index = indexOf(id)
		const previous = notes.value[index]
		// Returning quietly here would drop the user's edit on the floor: the cache
		// can lose a note to a concurrent archive while the editor is still open.
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
		enqueueFor(next, body.tagNames)
		await flush()
		return next
	}

	function setStatus(id: string, status: NoteStatus) {
		return update(id, { status })
	}

	// Archive is the delete tombstone; mergeIncoming refuses to bring these back.
	function remove(id: string) {
		const index = indexOf(id)
		const previous = notes.value[index]
		if (!previous) return
		notes.value.splice(index, 1)
		enqueueFor({ ...previous, status: noteStatus.archived, updatedAt: new Date() })
		void flush()
	}

	function isPending(id: string) {
		return unsyncedIds.value.has(id)
	}

	// Sync is app-lifetime, not page-lifetime, so this deliberately outlives the
	// calling component. The guard keeps a remount from stacking intervals.
	function start() {
		if (import.meta.server || started) return
		started = true
		void sync()
		useIntervalFn(() => void sync(), SYNC_INTERVAL_MS)
		useEventListener(window, 'online', () => void sync())
	}

	return {
		notes,
		pending,
		syncing,
		loadMore,
		start,
		sync,
		flush,
		retryNote,
		isPending,
		create,
		update,
		setStatus,
		remove,
	}
})
