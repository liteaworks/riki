import { noteStatus, noteVisibility } from '#shared/types/note'
import type {
	CreateNoteInput,
	ListNotesResponse,
	Note,
	NoteListItem,
	NoteStatus,
	UpdateNoteBody,
} from '#shared/types/note'
import { newId } from '#shared/utils/id'

export const useNoteStore = defineStore('note', () => {
	const authClient = useAuth()
	const session = authClient.useSession()
	const spaceStore = useSpaceStore()

	const notes = ref<NoteListItem[]>([])
	const nextCursor = ref<string | null>(null)
	const pending = ref(false)

	function indexOf(id: string) {
		return notes.value.findIndex((note) => note.id === id)
	}

	function spaceNameOf(spaceId: string | null) {
		if (!spaceId) return null
		return spaceStore.spaces.find((space) => space.id === spaceId)?.name ?? null
	}

	function replaceById(id: string, next: NoteListItem) {
		const index = indexOf(id)
		if (index !== -1) notes.value[index] = next
	}

	async function loadMore() {
		if (pending.value) return
		if (nextCursor.value === null && notes.value.length) return
		pending.value = true
		try {
			const data = await $fetch<ListNotesResponse>('/api/notes', {
				query: { limit: 20, ...(nextCursor.value ? { cursor: nextCursor.value } : {}) },
			})
			notes.value.push(...data.items)
			nextCursor.value = data.nextCursor
		} finally {
			pending.value = false
		}
	}

	// Mutations apply the intended state immediately, then reconcile with the
	// server row. On failure they restore the previous note and rethrow so the
	// caller owns the toast.
	async function create(input: CreateNoteInput) {
		const now = new Date()
		const tempId = `temp-${newId()}`
		const spaceId = input.spaceId ?? null
		notes.value.unshift({
			id: tempId,
			userId: session.value.data?.user?.id ?? '',
			content: input.content,
			spaceId,
			spaceName: spaceNameOf(spaceId),
			visibility: input.visibility ?? noteVisibility.private,
			status: input.status ?? noteStatus.normal,
			createdAt: now,
			updatedAt: now,
		})
		try {
			const created = await $fetch<Note>('/api/notes', { method: 'POST', body: input })
			replaceById(tempId, { ...created, spaceName: spaceNameOf(created.spaceId) })
			return created
		} catch (error) {
			const index = indexOf(tempId)
			if (index !== -1) notes.value.splice(index, 1)
			throw error
		}
	}

	async function update(id: string, body: UpdateNoteBody) {
		const previous = notes.value[indexOf(id)]
		if (previous) {
			replaceById(id, {
				...previous,
				content: body.content ?? previous.content,
				spaceId: body.spaceId === undefined ? previous.spaceId : body.spaceId,
				spaceName: body.spaceId === undefined ? previous.spaceName : spaceNameOf(body.spaceId),
				status: body.status ?? previous.status,
			})
		}
		try {
			const updated = await $fetch<Note>(`/api/notes/${id}`, { method: 'PATCH', body })
			replaceById(id, { ...updated, spaceName: spaceNameOf(updated.spaceId) })
			return updated
		} catch (error) {
			if (previous) replaceById(id, previous)
			throw error
		}
	}

	function setStatus(id: string, status: NoteStatus) {
		return update(id, { status })
	}

	async function remove(id: string) {
		const index = indexOf(id)
		const previous = notes.value[index]
		if (previous) notes.value.splice(index, 1)
		try {
			await $fetch(`/api/notes/${id}`, { method: 'DELETE' })
		} catch (error) {
			if (previous) {
				const at = indexOf(id)
				if (at === -1) notes.value.push(previous)
				else notes.value.splice(at, 0, previous)
			}
			throw error
		}
	}

	return { notes, pending, loadMore, create, update, setStatus, remove }
})
