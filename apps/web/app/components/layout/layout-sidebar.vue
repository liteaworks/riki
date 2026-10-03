<script setup lang="ts">
const appConfig = useAppConfig()

const open = defineModel<boolean>('open', { default: true })

withDefaults(
	defineProps<{
		collapsible?: 'offcanvas' | 'icon' | 'none'
	}>(),
	{
		collapsible: 'offcanvas',
	},
)
</script>

<template>
	<USidebar rail v-model:open="open" :collapsible="collapsible">
		<template #title v-if="!isTauri">
			<UButton
				v-if="$route.path !== '/'"
				:label="$t('header.backToApp')"
				:icon="appConfig.ui.icons.arrowLeft"
				to="/"
				color="neutral"
				variant="ghost"
				class="w-full px-1.5"
				:ui="{
					label: 'text-toned',
				}"
			/>
			<div v-else class="flex items-center justify-between">
				<LayoutDropdownMenu />
				<NoteNewButton variant="ghost" />
			</div>
		</template>
		<slot />
	</USidebar>
</template>
