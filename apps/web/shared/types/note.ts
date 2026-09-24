import * as z from 'zod'
import type { notes, spaces, tags } from '#server/db/schemas/note-schema'

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert
export type Space = typeof spaces.$inferSelect
export type NewSpace = typeof spaces.$inferInsert
export type Tag = typeof tags.$inferSelect
export type NewTag = typeof tags.$inferInsert

export const noteVisibility = {
	private: 'private',
	public: 'public',
	protected: 'protected',
} as const
export type NoteVisibility = (typeof noteVisibility)[keyof typeof noteVisibility]
export const noteVisibilityValues = Object.values(noteVisibility) as [
	NoteVisibility,
	...NoteVisibility[],
]

export const noteStatus = {
	normal: 'normal',
	pinned: 'pinned',
	archived: 'archived',
} as const
export type NoteStatus = (typeof noteStatus)[keyof typeof noteStatus]
export const noteStatusValues = Object.values(noteStatus) as [NoteStatus, ...NoteStatus[]]

export const createNoteBodySchema = z.object({
	content: z.string().trim().min(1),
	spaceId: z
		.string()
		.trim()
		.min(1)
		.nullish()
		.transform((value) => value ?? null),
	tagNames: z.array(z.string().trim().min(1)).optional(),
	visibility: z.enum(noteVisibility).default(noteVisibility.private),
	status: z.enum(noteStatus).default(noteStatus.normal),
})

export type CreateNoteBody = z.output<typeof createNoteBodySchema>

export const updateNoteBodySchema = z
	.object({
		content: z.string().trim().min(1).optional(),
		tagNames: z.array(z.string().trim().min(1)).optional(),
		status: z.enum(noteStatus).optional(),
	})
	.refine((body) => body.content !== undefined || body.tagNames !== undefined || body.status !== undefined, {
		message: 'Empty update',
	})

export type UpdateNoteBody = z.output<typeof updateNoteBodySchema>

const noteCursorSchema = z
	.string()
	.regex(/^\d+:[^:]+$/)
	.transform((value) => {
		const separator = value.indexOf(':')
		return {
			createdAt: new Date(Number(value.slice(0, separator))),
			id: value.slice(separator + 1),
		}
	})
	.refine((cursor) => !Number.isNaN(cursor.createdAt.getTime()))

export const listNotesQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(20),
	cursor: noteCursorSchema.optional(),
})

export type ListNotesQuery = z.output<typeof listNotesQuerySchema>

export type ListNotesResponse = { items: Note[]; nextCursor: string | null }
