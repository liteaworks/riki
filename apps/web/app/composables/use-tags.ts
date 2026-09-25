import type { TagListItem } from '#shared/types/tag'

export function useTags() {
	const tags = ref<TagListItem[]>([])
	const pending = ref(false)

	async function load() {
		if (pending.value) return
		pending.value = true
		try {
			tags.value = await $fetch<TagListItem[]>('/api/tags', { query: { limit: 50 } })
		} finally {
			pending.value = false
		}
	}

	onMounted(() => {
		void load()
	})

	return { tags, load }
}
