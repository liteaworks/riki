import { noteVisibility } from '#shared/types/note'
import type { NoteVisibility } from '#shared/types/note'

export const noteVisibilityMeta: Record<
	NoteVisibility,
	{ label: string; icon: 'lock' | 'user' | 'globe' }
> = {
	[noteVisibility.private]: { label: 'note.visibilityPrivate', icon: 'lock' },
	[noteVisibility.protected]: { label: 'note.visibilityProtected', icon: 'user' },
	[noteVisibility.public]: { label: 'note.visibilityPublic', icon: 'globe' },
}
