<script setup lang="ts">
const model = defineModel<'light' | 'dark' | 'system'>()

const appConfig = useAppConfig()
const colorMode = useColorMode()

function update(val: string | number) {
	if (val === 'light' || val === 'dark' || val === 'system') colorMode.preference = val
}

const items = computed(() => [
	{
		value: 'light',
		label: $t('settings.preferences.colorMode.light'),
		icon: appConfig.ui.icons.light,
	},
	{
		value: 'dark',
		label: $t('settings.preferences.colorMode.dark'),
		icon: appConfig.ui.icons.dark,
	},
	{
		value: 'system',
		label: $t('settings.preferences.colorMode.system'),
		icon: appConfig.ui.icons.system,
	},
])
</script>

<template>
	<UTabs
		v-model="model"
		:content="false"
		:items="items"
		color="neutral"
		size="sm"
		class="w-auto"
		@update:model-value="update"
	/>
</template>
