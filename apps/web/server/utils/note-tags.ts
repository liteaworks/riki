import { db } from '#server/utils/db'
import { noteTags, tags } from '#server/db/schemas'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { chunk } from '#shared/utils/chunk'

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

// D1 allows 100 bound parameters per query, so the `IN (...)` list and the insert
// batch are both chunked. Callers touching many notes must use this rather than
// looping `resolveTagIdsForNames`, which costs a batch + select per note.
const D1_CHUNK = 50

export async function resolveTagIdMap(
	userId: string,
	tagNames: string[],
): Promise<Map<string, string>> {
	const deduped = dedupeTagNames(tagNames)
	if (!deduped.length) return new Map()
	const groups = chunk(deduped, D1_CHUNK)
	for (const group of groups) await ensureTags(userId, group)

	const byName = new Map<string, string>()
	for (const group of groups) {
		const rows = await db
			.select({ id: tags.id, name: tags.name })
			.from(tags)
			.where(
				and(
					eq(tags.userId, userId),
					inArray(
						sql`lower(${tags.name})`,
						group.map((name) => name.toLowerCase()),
					),
				),
			)
		for (const row of rows) byName.set(row.name.toLowerCase(), row.id)
	}
	return byName
}

export async function resolveTagIdsForNames(userId: string, tagNames: string[]): Promise<string[]> {
	const deduped = dedupeTagNames(tagNames)
	const byName = await resolveTagIdMap(userId, deduped)
	return deduped.map((name) => {
		const id = byName.get(name.toLowerCase())
		if (!id) throw createError({ statusCode: 500, statusMessage: 'Failed to resolve tag' })
		return id
	})
}

export function tagLinkInserts(noteId: string, tagIds: string[]) {
	return tagIds.map((tagId) => db.insert(noteTags).values({ noteId, tagId }).onConflictDoNothing())
}
