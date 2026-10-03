const PREFIX = 'rikki'

export const localKeys = {
	notes: `${PREFIX}.notes`,
	notesCursor: `${PREFIX}.notes.cursor.v2`,
	outbox: `${PREFIX}.outbox`,
	drafts: `${PREFIX}.drafts`,
} as const
