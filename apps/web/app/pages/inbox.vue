<script setup lang="ts">
const sidebarOpen = ref(true)
const appConfig = useAppConfig()

useNoteStore().start()
</script>

<template>
	<NoteSidebar v-model:open="sidebarOpen" />
	<div class="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden">
		<div class="flex w-full max-w-3xl items-center gap-1">
			<UButton
				class="lg:hidden"
				:icon="appConfig.ui.icons.menu"
				color="neutral"
				variant="ghost"
				:aria-label="$t('header.openSidebar')"
				@click="sidebarOpen = !sidebarOpen"
			/>
		</div>
	</div>
	<ChatSidebar />
</template>
