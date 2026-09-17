import { defineRelationsPart, sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core'
import { user } from './auth-schema'

export const notes = sqliteTable(
	'notes',
	{
		id: text('id').primaryKey(),
		content: text('content').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		spaceId: text('space_id').references(() => spaces.id, { onDelete: 'set null' }),
		visibility: text('visibility', { enum: ['public', 'protected', 'private'] })
			.notNull()
			.default('private'),
		status: text('status', { enum: ['normal', 'pinned', 'archived'] })
			.notNull()
			.default('normal'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index('notes_userId_idx').on(table.userId),
		index('notes_spaceId_idx').on(table.spaceId),
	],
)

export const spaces = sqliteTable(
	'spaces',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index('spaces_userId_idx').on(table.userId)],
)

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
})

export const noteTags = sqliteTable(
	'note_tags',
	{
		noteId: text('note_id')
			.notNull()
			.references(() => notes.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
	},
	(table) => [
		primaryKey({ columns: [table.noteId, table.tagId] }),
		index('noteTags_tagId_idx').on(table.tagId),
	],
)

export const appRelations = defineRelationsPart({ user, spaces, tags, noteTags, notes }, (r) => ({
	user: {
		spaces: r.many.spaces({
			from: r.user.id,
			to: r.spaces.userId,
		}),
		notes: r.many.notes({
			from: r.user.id,
			to: r.notes.userId,
		}),
	},
	space: {
		user: r.one.user({
			from: r.spaces.userId,
			to: r.user.id,
		}),
		notes: r.many.notes({
			from: r.spaces.id,
			to: r.notes.spaceId,
		}),
	},
	note: {
		user: r.one.user({
			from: r.notes.userId,
			to: r.user.id,
		}),
		space: r.one.spaces({
			from: r.notes.spaceId,
			to: r.spaces.id,
		}),
		tags: r.many.tags({
			from: r.noteTags.noteId,
			to: r.tags.id,
		}),
	},
	tag: {
		note: r.many.notes({
			from: r.tags.id,
			to: r.noteTags.tagId,
		}),
	},
}))
