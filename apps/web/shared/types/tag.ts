import * as z from 'zod'
import type { Tag } from './note'

export const listTagsQuerySchema = z.object({
	q: z.string().trim().max(64).optional(),
	limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type ListTagsQuery = z.output<typeof listTagsQuerySchema>

export type TagListItem = Pick<Tag, 'id' | 'name'> & { usageCount: number }

export type ListTagsResponse = TagListItem[]
