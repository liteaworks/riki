import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { schema } from '#auth/schema'

export const notes = sqliteTable('notes', {
	id: text('id').primaryKey(),
	content: text('content').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => schema?.user.id, { onDelete: 'cascade' }),
	spaceId: text('space_id').references(() => spaces.id, { onDelete: 'set null' }),
	visibility: text('visibility', { enum: ['public', 'protected', 'private'] })
		.notNull()
		.default('private'),
	status: text('status', { enum: ['normal', 'pinned', 'archived'] }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
})

export const spaces = sqliteTable('spaces', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => schema?.user.id, { onDelete: 'cascade' }),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
})

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

export const noteTags = sqliteTable('note_tags', {
	noteId: text('note_id')
		.notNull()
		.references(() => notes.id, { onDelete: 'cascade' }),
	tagId: text('tag_id')
		.notNull()
		.references(() => tags.id, { onDelete: 'cascade' }),
})

export const userRelations = relations(schema?.user, ({ many }) => ({
	notes: many(notes),
	spaces: many(spaces),
}))

export const spaceRelations = relations(spaces, ({ one, many }) => ({
	user: one(schema?.user, {
		fields: [spaces.userId],
		references: [schema?.user.id],
	}),
	notes: many(notes),
}))

export const noteRelations = relations(notes, ({ one, many }) => ({
	user: one(schema?.user, {
		fields: [notes.userId],
		references: [schema?.user.id],
	}),
	space: one(spaces, {
		fields: [notes.spaceId],
		references: [spaces.id],
	}),
	tags: many(tags),
}))

export const tagRelations = relations(tags, ({ many }) => ({
	notes: many(notes),
}))
