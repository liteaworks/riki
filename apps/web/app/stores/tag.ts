import type { TagListItem } from '#shared/types/tag'

export const useTagStore = defineStore('tag', () => {
	const tags = ref<TagListItem[]>([])
	const pending = ref(false)
	const loaded = ref(false)

	async function load(options?: { force?: boolean }) {
		if (pending.value) return
		if (loaded.value && !options?.force) return
		pending.value = true
		const rows = await $fetch<TagListItem[]>('/api/tags', { query: { limit: 50 } }).catch(
			() => null,
		)
		if (rows) {
			tags.value = rows
			loaded.value = true
		}
		pending.value = false
	}

	async function search(query: string) {
		return await $fetch<TagListItem[]>('/api/tags', { query: { q: query, limit: 10 } })
	}

	async function deleteTag(id: string) {
		await $fetch(`/api/tags/${id}`, { method: 'DELETE' })
		tags.value = tags.value.filter((tag) => tag.id !== id)
	}

	return { tags, pending, loaded, load, search, deleteTag }
})
