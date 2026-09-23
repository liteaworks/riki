<script setup lang="ts">
import { mentionChipClass } from '~/theme/ui'

defineProps<{
	label?: string
	char?: string
}>()
</script>

<template>
	<span :class="mentionChipClass">{{ char }}{{ label }}</span>
</template>
