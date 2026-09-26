import { skipHydrate } from 'pinia'
import { localKeys } from '../utils/local-cache'

const DRAFT_KIND = 'rikki.draft'
const DRAFT_VERSION = 1
const DRAFT_DEBOUNCE_MS = 500

interface DraftEntry {
	kind: typeof DRAFT_KIND
	version: number
	content: string
}

// Drafts were historically stored as raw markdown, and a future entry version
// must not read as empty, so anything unrecognised is returned verbatim.
function unwrap(stored: string): string {
	try {
		const parsed = JSON.parse(stored) as Partial<DraftEntry>
		if (
			parsed.kind === DRAFT_KIND &&
			parsed.version === DRAFT_VERSION &&
			typeof parsed.content === 'string'
		) {
			return parsed.content
		}
	} catch {}
	return stored
}

export const useDraftStore = defineStore('draft', () => {
	const authClient = useAuth()
	const session = authClient.useSession()

	// scope -> serialised entry. skipHydrate is required or the SSR default
	// clobbers the stored drafts on every page load.
	const drafts = skipHydrate(useLocalStorage<Record<string, string>>(localKeys.drafts, {}))

	const timers = new Map<string, ReturnType<typeof setTimeout>>()

	const userId = computed(() => session.value.data?.user?.id)

	// A draft under a placeholder scope is unreadable once the real user id
	// arrives, so nothing is persisted until the session resolves.
	const isIdentified = computed(() => Boolean(userId.value))

	function scopeFor(noteId?: string | null) {
		return `${userId.value ?? 'anonymous'}:${noteId ?? 'new'}`
	}

	function load(scope: string) {
		const stored = drafts.value[scope]
		return stored === undefined ? '' : unwrap(stored)
	}

	function write(scope: string, content: string) {
		if (!content.trim()) {
			discard(scope)
			return
		}
		const entry: DraftEntry = { kind: DRAFT_KIND, version: DRAFT_VERSION, content }
		drafts.value = { ...drafts.value, [scope]: JSON.stringify(entry) }
	}

	function save(scope: string, content: string) {
		if (import.meta.server || !isIdentified.value) return
		const pending = timers.get(scope)
		if (pending) clearTimeout(pending)
		timers.set(
			scope,
			setTimeout(() => {
				timers.delete(scope)
				write(scope, content)
			}, DRAFT_DEBOUNCE_MS),
		)
	}

	// Clearing the entry is not enough: a debounced write still in flight would
	// resurrect the just-saved note as a stale draft when the editor unmounts.
	function discard(scope: string) {
		const pending = timers.get(scope)
		if (pending) {
			clearTimeout(pending)
			timers.delete(scope)
		}
		if (!(scope in drafts.value)) return
		const next = { ...drafts.value }
		delete next[scope]
		drafts.value = next
	}

	// "Modified but not saved": a stored draft that differs from the saved note.
	function isDirty(scope: string, baseline: string) {
		const stored = drafts.value[scope]
		return stored !== undefined && unwrap(stored) !== baseline
	}

	return { drafts, scopeFor, load, save, discard, isDirty }
})
