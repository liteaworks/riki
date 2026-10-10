<script lang="ts" setup>
import type { TimeFormat } from '~/utils/time'

const model = defineModel<TimeFormat>()

const items = computed(() => [
	{ code: 'relative' as const, name: $t('settings.preferences.timeFormatRelative') },
	{ code: 'absolute' as const, name: $t('settings.preferences.timeFormatAbsolute') },
])
</script>

<template>
	<USelectMenu
		v-model="model"
		:items="items"
		label-key="name"
		value-key="code"
		:search-input="false"
	/>
</template>
