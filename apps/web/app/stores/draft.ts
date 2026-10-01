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

// Unrecognised entries are returned verbatim: drafts were once raw markdown, and
// a future version must not read as empty.
function unwrap(stored: string): string {
	try {
		const parsed = JSON.parse(stored) as Partial<DraftEntry>
		return parsed.kind === DRAFT_KIND &&
			parsed.version === DRAFT_VERSION &&
			typeof parsed.content === 'string'
			? parsed.content
			: stored
	} catch {
		return stored
	}
}

export const useDraftStore = defineStore('draft', () => {
	const drafts = skipHydrate(useLocalStorage<Record<string, string>>(localKeys.drafts, {}))

	const timers = new Map<string, ReturnType<typeof setTimeout>>()

	function scopeFor(noteId?: string | null) {
		return noteId ?? 'new'
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
		if (import.meta.server) return
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
	// resurrect the saved note as a stale draft on unmount.
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

	function isDirty(scope: string, baseline: string) {
		const stored = drafts.value[scope]
		return stored !== undefined && unwrap(stored) !== baseline
	}

	return { drafts, scopeFor, load, save, discard, isDirty }
})
