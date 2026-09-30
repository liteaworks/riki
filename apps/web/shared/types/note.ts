import * as z from 'zod'

export interface Note {
	id: string
	content: string
	userId: string
	spaceId: string | null
	visibility: NoteVisibility
	status: NoteStatus
	createdAt: Date
	updatedAt: Date
}

export interface Space {
	id: string
	name: string
	userId: string
	createdAt: Date
	updatedAt: Date
}

export interface Tag {
	id: string
	name: string
	userId: string
	createdAt: Date
	updatedAt: Date
}

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
	id: z.string().trim().min(1).max(64).optional(),
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

export type CreateNoteInput = z.input<typeof createNoteBodySchema>
export type CreateNoteBody = z.output<typeof createNoteBodySchema>

export const updateNoteBodySchema = z
	.object({
		content: z.string().trim().min(1).optional(),
		spaceId: z.union([z.string().trim().min(1), z.null()]).optional(),
		tagNames: z.array(z.string().trim().min(1)).optional(),
		visibility: z.enum(noteVisibility).optional(),
		status: z.enum(noteStatus).optional(),
		updatedAt: z.number().int().positive().optional(),
	})
	.refine(
		(body) =>
			body.content !== undefined ||
			body.spaceId !== undefined ||
			body.tagNames !== undefined ||
			body.status !== undefined ||
			body.visibility !== undefined,
		{
			message: 'Empty update',
		},
	)

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
	spaceId: z.string().trim().min(1).optional(),
	noSpace: z.coerce.boolean().optional(),
	tagIds: z.preprocess(
		(value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
		z.array(z.string().trim().min(1)).optional(),
	),
	visibility: z.preprocess(
		(value) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]),
		z.array(z.enum(noteVisibility)).optional(),
	),
	pinnedOnly: z.coerce.boolean().optional(),
	q: z.string().trim().min(1).optional(),
})

export type ListNotesQuery = z.output<typeof listNotesQuerySchema>

export type NoteListItem = Note & {
	spaceName: string | null
	authorName: string | null
	authorImage: string | null
}

export type ListNotesResponse = { items: NoteListItem[]; nextCursor: string | null }
