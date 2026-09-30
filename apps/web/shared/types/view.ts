import * as z from 'zod'
import { noteVisibility } from './note'

export interface View {
	id: string
	name: string
	filter: ViewFilter
	position: number
	userId: string
	createdAt: Date
	updatedAt: Date
}

export interface SidebarEntry {
	id: string
	kind: SidebarKind
	targetId: string
	position: number
	userId: string
	createdAt: Date
	updatedAt: Date
}

export const sidebarKind = {
	view: 'view',
	space: 'space',
	tag: 'tag',
} as const
export type SidebarKind = (typeof sidebarKind)[keyof typeof sidebarKind]
export const sidebarKindValues = Object.values(sidebarKind) as [SidebarKind, ...SidebarKind[]]

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
