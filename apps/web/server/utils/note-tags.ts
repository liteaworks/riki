import { db } from '#server/utils/db'
import { noteTags, tags } from '#server/db/schemas'
import { and, eq, inArray, sql } from 'drizzle-orm'

function dedupeTagNames(tagNames: string[]): string[] {
	const deduped = new Map<string, string>()
	for (const name of tagNames) {
		const key = name.toLowerCase()
		if (!deduped.has(key)) deduped.set(key, name)
	}
	return [...deduped.values()]
}

async function ensureTags(userId: string, tagNames: string[]): Promise<void> {
	const [first, ...rest] = tagNames
	if (!first) return
	await db.batch([
		db.insert(tags).values({ userId, name: first }).onConflictDoNothing(),
		...rest.map((name) => db.insert(tags).values({ userId, name }).onConflictDoNothing()),
	])
}

async function resolveTagIds(userId: string, tagNames: string[]): Promise<string[]> {
	if (!tagNames.length) return []
	const rows = await db
		.select({ id: tags.id, name: tags.name })
		.from(tags)
		.where(
			and(
				eq(tags.userId, userId),
				inArray(
					sql`lower(${tags.name})`,
					tagNames.map((name) => name.toLowerCase()),
				),
			),
		)
	const byKey = new Map(rows.map((tag) => [tag.name.toLowerCase(), tag.id]))
	return tagNames.map((name) => {
		const id = byKey.get(name.toLowerCase())
		if (!id) throw createError({ statusCode: 500, statusMessage: 'Failed to resolve tag' })
		return id
	})
}

export async function resolveTagIdsForNames(userId: string, tagNames: string[]): Promise<string[]> {
	const deduped = dedupeTagNames(tagNames)
	await ensureTags(userId, deduped)
	return resolveTagIds(userId, deduped)
}

export function tagLinkInserts(noteId: string, tagIds: string[]) {
	return tagIds.map((tagId) => db.insert(noteTags).values({ noteId, tagId }).onConflictDoNothing())
}
