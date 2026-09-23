<script setup lang="ts">
import { mentionChipClass } from '~/theme/ui'

defineProps<{
	label?: string
}>()
</script>

<template>
	<span :class="mentionChipClass">{{ `#${label}` }}</span>
</template>
