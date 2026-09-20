<script setup lang="ts">
defineProps<{
	label: string
}>()
</script>

<template>
	<div class="pb-4">
		<div v-if="label" class="ml-4 text-sm text-muted sm:text-xs">
			{{ label }}
		</div>
		<div class="flex flex-col gap-1 pt-1 first:pt-0">
			<slot />
		</div>
	</div>
</template>
