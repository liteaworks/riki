import { LazyNoteEditorModal } from '#components'
import type { Note } from '#shared/types/note'

// Single overlay instance shared by the "new note" buttons in the page and in the sidebar.
let openEditor: ((note?: Note) => void) | undefined

export function openComposer(note?: Note) {
	if (!openEditor) {
		const editorModal = useOverlay().create(LazyNoteEditorModal)
		openEditor = (target?: Note) => editorModal.open({ note: target ?? null })
	}
	openEditor(note)
}
