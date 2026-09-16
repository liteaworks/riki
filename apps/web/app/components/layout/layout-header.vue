<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const appConfig = useAppConfig()

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: $t('settings.label'),
			icon: appConfig.ui.icons.settings,
			to: appConfig.routes.settings.general,
		},
	],
])

async function handleWindowDrag(event: MouseEvent) {
	if (!isTauri) return

	const target = event.target as HTMLElement
	if (
		target.closest('button') ||
		target.closest('[role="button"]') ||
		target.closest('input') ||
		target.closest('select')
	) {
		return
	}

	if (event.button !== 0) return

	try {
		const windows = await useTauriWindowGetAllWindows()

		windows.forEach((window) => {
			if (window.label === 'main') window.startDragging()
		})
	} catch (error) {
		console.error(error)
	}
}
</script>

<template>
	<div
		class="sticky top-0 z-50 flex h-(--ui-header-height) items-center justify-between border-b bg-default pl-2"
		@mousedown="handleWindowDrag"
	>
		<section class="flex h-full items-center gap-2">
			<div class="flex items-center">
				<UTooltip v-if="$route.path !== '/'" :text="$t('header.backToApp')">
					<UButton :icon="appConfig.ui.icons.arrowLeft" to="/" color="neutral" variant="ghost" />
				</UTooltip>
				<LayoutDropdownMenu />
			</div>
			<span class="text-sm">{{ appConfig.app.name }}</span>
		</section>
		<LayoutWindowControlButtons v-if="isTauri" />
	</div>
</template>
