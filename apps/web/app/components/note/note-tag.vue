<script setup lang="ts">
import { tagChip } from '~/theme/ui'

const props = defineProps<{
	label?: string
}>()

const tagStore = useTagStore()

const tagId = computed(() => {
	const label = props.label?.trim()
	if (!label) return null
	return tagStore.tags.find((tag) => tag.name.toLowerCase() === label.toLowerCase())?.id ?? null
})

const state = computed(() => (tagStore.loaded && !tagId.value ? 'deleted' : 'active'))
</script>

<template>
	<NuxtLink
		v-if="label && tagId"
		:to="{ path: '/', query: { tag: tagId } }"
		:class="tagChip()"
		@click.stop
	>
		{{ `#${label}` }}
	</NuxtLink>
	<span v-else :class="tagChip({ state })">{{ `#${label}` }}</span>
</template>
