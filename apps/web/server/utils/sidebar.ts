import { db } from '#server/utils/db'
import { sidebar } from '#server/db/schemas'
import { asc, eq, sql } from 'drizzle-orm'

async function writePositions(userId: string, order: string[]) {
	if (!order.length) return
	await db
		.update(sidebar)
		.set({
			position: sql`case ${sidebar.id} ${sql.join(
				order.map((id, position) => sql`when ${id} then ${position}`),
				sql` `,
			)} else ${sidebar.position} end`,
		})
		.where(eq(sidebar.userId, userId))
}

async function orderedIds(userId: string) {
	const rows = await db
		.select({ id: sidebar.id })
		.from(sidebar)
		.where(eq(sidebar.userId, userId))
		.orderBy(asc(sidebar.position))
	return rows.map((row) => row.id)
}

export async function reorderSidebar(userId: string, id: string, position: number) {
	const order = await orderedIds(userId)
	const from = order.indexOf(id)
	if (from === -1) return null
	order.splice(Math.min(position, order.length - 1), 0, ...order.splice(from, 1))
	await writePositions(userId, order)
	return id
}

export async function compactSidebar(userId: string) {
	await writePositions(userId, await orderedIds(userId))
}
