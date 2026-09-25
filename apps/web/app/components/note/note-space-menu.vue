<script setup lang="ts">
import type { SelectMenuItem } from '@nuxt/ui'

const modelValue = defineModel<string | null>()

const { t } = useI18n()
const appConfig = useAppConfig()

const spaceStore = useSpaceStore()
const { spaces } = storeToRefs(spaceStore)

onMounted(() => {
	void spaceStore.load()
})

const items = computed<SelectMenuItem[]>(() =>
	spaces.value.map((space) => ({
		id: space.id,
		label: space.name,
		icon: spaceStore.iconForSpace(space),
	})),
)

const selectedIcon = computed(() => {
	const space = spaces.value.find((item) => item.id === modelValue.value)
	return space ? spaceStore.iconForSpace(space) : appConfig.ui.icons.inbox
})
</script>

<template>
	<USelectMenu
		v-model="modelValue"
		value-key="id"
		:items="items"
		:placeholder="t('note.inbox')"
		:content="{ align: 'start', side: 'top' }"
		:icon="selectedIcon"
		:clear-icon="appConfig.ui.icons.close"
		:search-input="{
			placeholder: $t('common.searchLabelPlaceholder', {
				label: $t('space.label'),
			}),
		}"
		color="neutral"
		variant="ghost"
		clear
	/>
</template>
