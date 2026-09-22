import { nanoid } from 'nanoid'

export function newId(size = 21) {
	return nanoid(size)
}
