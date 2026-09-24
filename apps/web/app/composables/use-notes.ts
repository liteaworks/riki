import { LazyNoteEditorModal } from '#components'
import type { ListNotesResponse, Note } from '#shared/types/note'

export function useNotes() {
	const overlay = useOverlay()
	const editorModal = overlay.create(LazyNoteEditorModal)

	const notes = ref<Note[]>([])
	const nextCursor = ref<string | null>(null)
	const pending = ref(false)
	const scrollArea = useTemplateRef<{
		$el: HTMLElement
		virtualizer?: { scrollToIndex: (index: number, options?: Record<string, unknown>) => void }
	}>('scrollArea')

	async function loadMore() {
		if (pending.value) return
		if (nextCursor.value === null && notes.value.length) return
		pending.value = true
		try {
			const data = await $fetch<ListNotesResponse>('/api/notes', {
				query: { limit: 20, ...(nextCursor.value ? { cursor: nextCursor.value } : {}) },
			})
			notes.value.push(...data.items)
			nextCursor.value = data.nextCursor
		} finally {
			pending.value = false
		}
	}

	function prependNote(note: unknown) {
		notes.value.unshift(note as Note)
	}

	function handleCreated(note: unknown) {
		prependNote(note)
		scrollArea.value?.virtualizer?.scrollToIndex(0, { align: 'start' })
	}

	function removeNote(id: string) {
		notes.value = notes.value.filter((note) => note.id !== id)
	}

	function updateNote(note: Note) {
		const index = notes.value.findIndex((item) => item.id === note.id)
		if (index !== -1) notes.value[index] = note
	}

	function openComposer(note?: Note) {
		editorModal.open({ note: note ?? null, onCreated: handleCreated, onUpdated: updateNote })
	}

	onMounted(() => {
		loadMore()
		useInfiniteScroll(
			() => scrollArea.value?.$el,
			() => loadMore(),
			{ distance: 200 },
		)
	})

	return { notes, openComposer, removeNote, updateNote }
}
