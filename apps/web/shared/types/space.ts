import * as z from 'zod'
import type { Space } from './note'

export const createSpaceBodySchema = z.object({
	name: z.string().trim().min(1).max(64),
})

export type CreateSpaceBody = z.output<typeof createSpaceBodySchema>

export const updateSpaceBodySchema = z.object({
	name: z.string().trim().min(1).max(64),
})

export type UpdateSpaceBody = z.output<typeof updateSpaceBodySchema>

export type SpaceListItem = Pick<Space, 'id' | 'name'> & { noteCount: number }
