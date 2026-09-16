<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const appConfig = useAppConfig()

const items = computed<NavigationMenuItem[]>(() => [
	{
		label: $t('settings.general.label'),
		icon: appConfig.ui.icons.settings,
		to: appConfig.routes.settings.general,
	},
])
</script>

<template>
	<LayoutSidebar collapsible="icon">
		<UNavigationMenu
			:items="items"
			orientation="vertical"
			:ui="{ link: 'p-1.5 overflow-hidden' }"
		/>
	</LayoutSidebar>
</template>
