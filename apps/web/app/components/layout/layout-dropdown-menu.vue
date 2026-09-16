<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const appConfig = useAppConfig()

const dropdownMenuItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: $t('settings.label'),
			icon: appConfig.ui.icons.settings,
			to: appConfig.routes.settings.general,
		},
	],
])
</script>

<template>
	<UDropdownMenu :items="dropdownMenuItems">
		<UTooltip :text="$t('header.openAppMenu')">
			<UButton :icon="appConfig.ui.icons.menu" color="neutral" variant="ghost" />
		</UTooltip>
	</UDropdownMenu>
</template>
