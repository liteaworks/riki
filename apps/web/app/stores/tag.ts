import type { TagListItem } from '#shared/types/tag'

export const useTagStore = defineStore('tag', () => {
	const tags = ref<TagListItem[]>([])
	const pending = ref(false)
	const loaded = ref(false)

	async function load(options?: { force?: boolean }) {
		if (pending.value) return
		if (loaded.value && !options?.force) return
		pending.value = true
		try {
			tags.value = await $fetch<TagListItem[]>('/api/tags', { query: { limit: 50 } })
			loaded.value = true
		} catch {
			// A preload must not break the page; `loaded` stays false to retry.
		} finally {
			pending.value = false
		}
	}

	async function search(query: string) {
		return await $fetch<TagListItem[]>('/api/tags', { query: { q: query, limit: 10 } })
	}

	return { tags, pending, loaded, load, search }
})
