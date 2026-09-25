<script setup lang="ts">
import type { EditorMentionMenuItem } from '@nuxt/ui'
import type { TagListItem } from '#shared/types/tag'

defineProps<{
	editor: any
}>()

const appConfig = useAppConfig()

const tagStore = useTagStore()

const searchTerm = ref('')
const debouncedSearchTerm = refDebounced(searchTerm, 200)
const results = ref<TagListItem[]>([])
let requestId = 0

watch(
	debouncedSearchTerm,
	async (term) => {
		const id = ++requestId
		const list = await tagStore.search(term.trim().replace(/\/+$/, ''))
		if (id !== requestId) return
		results.value = list
	},
	{ immediate: true },
)

const name = computed(() => searchTerm.value.trim().replace(/\/+$/, ''))
const query = computed(() => name.value.toLowerCase())

const items = computed<EditorMentionMenuItem[]>(() => {
	const matches = results.value.map((tag) => ({ label: tag.name }))
	if (name.value && !matches.some((item) => item.label.toLowerCase() === query.value)) {
		return [{ label: name.value, icon: appConfig.ui.icons.plus }, ...matches]
	}
	return matches
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
