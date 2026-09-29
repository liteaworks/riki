import * as z from 'zod'
import type { sidebar, views } from '#server/db/schemas/note-schema'
import { noteVisibility } from './note'

export type View = typeof views.$inferSelect
export type SidebarEntry = typeof sidebar.$inferSelect

export const sidebarKind = {
	view: 'view',
	space: 'space',
	tag: 'tag',
} as const
export type SidebarKind = (typeof sidebarKind)[keyof typeof sidebarKind]
export const sidebarKindValues = Object.values(sidebarKind) as [SidebarKind, ...SidebarKind[]]

// Library and Inbox are code constants, not rows: always at the head of the pinned
// section, never renamed, reordered, unpinned or deleted.
export const builtinView = {
	library: 'library',
	inbox: 'inbox',
} as const
export type BuiltinView = (typeof builtinView)[keyof typeof builtinView]

export type SidebarTarget = { kind: BuiltinView | SidebarKind; id: string }

export const viewFilterSchema = z.object({
	spaceId: z.string().trim().min(1).nullable().optional(),
	tagIds: z.array(z.string().trim().min(1)).optional(),
	visibility: z.array(z.enum(noteVisibility)).optional(),
	pinnedOnly: z.boolean().optional(),
	q: z.string().trim().min(1).optional(),
})
export type ViewFilter = z.infer<typeof viewFilterSchema>

export const createViewBodySchema = z.object({
	name: z.string().trim().min(1).max(64),
	filter: viewFilterSchema.default({}),
})
export type CreateViewBody = z.output<typeof createViewBodySchema>

export const updateViewBodySchema = z.object({
	name: z.string().trim().min(1).max(64).optional(),
	filter: viewFilterSchema.optional(),
})
export type UpdateViewBody = z.output<typeof updateViewBodySchema>

export const pinSidebarBodySchema = z.object({
	kind: z.enum(sidebarKind),
	targetId: z.string().trim().min(1),
})
export type PinSidebarBody = z.infer<typeof pinSidebarBodySchema>

export const reorderSidebarBodySchema = z.object({
	position: z.number().int().min(0),
})
export type ReorderSidebarBody = z.infer<typeof reorderSidebarBodySchema>
