<script setup lang="ts">
import type { EditorMentionMenuItem } from '@nuxt/ui'
import type { ListTagsResponse } from '#shared/types/tag'

defineProps<{
	editor: any
}>()

const appConfig = useAppConfig()

const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 200)

const { data } = useFetch<ListTagsResponse>('/api/tags', {
	query: { q: debouncedSearchTerm, limit: 10 },
	server: false,
})

const items = computed<EditorMentionMenuItem[]>(() => {
	const list = (data.value ?? []).map((tag) => ({ label: tag.name }))
	let name = debouncedSearchTerm.value.trim()
	while (name.endsWith('/')) name = name.slice(0, -1)
	if (name && !list.some((item) => item.label.toLowerCase() === name.toLowerCase())) {
		return [{ label: name, icon: appConfig.ui.icons.plus }, ...list]
	}
	return list
})
</script>

<template>
	<UEditorMentionMenu
		v-model:search-term="searchTerm"
		:editor="editor"
		:items="items"
		char="#"
		plugin-key="tagMenu"
		:suggestion="{ allowedPrefixes: null }"
		ignore-filter
	/>
</template>
