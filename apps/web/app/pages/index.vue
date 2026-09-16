<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
	<NoteSidebar />
	<div class="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden p-2">
		<div class="grid w-full grid-cols-3 gap-2">
			<NoteListItem />
			<NoteListItem />
			<NoteListItem />
			<NoteListItem />
		</div>
		<div class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
			<UButton
				:icon="appConfig.ui.icons.plus"
				label="New"
				color="primary"
				variant="soft"
				size="lg"
				class="rounded-full"
			/>
		</div>
	</div>
	<ChatSidebar />
</template>
