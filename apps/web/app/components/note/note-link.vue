<script setup lang="ts">
defineProps<{
	href?: string
}>()
</script>

<template>
	<ProseA :href="href" target="_blank" rel="noopener noreferrer" @click.stop>
		<slot />
	</ProseA>
</template>
