<script setup lang="ts">
const { notes, openComposer, removeNote, updateNote } = useNotes()
</script>

<template>
	<NoteSidebar />
	<div class="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden">
		<UScrollArea
			ref="scrollArea"
			v-slot="{ item }"
			:items="notes"
			shadow
			:virtualize="{ gap: 8, lanes: 3, estimateSize: 200 }"
			class="size-full p-2"
		>
			<NoteListItem :note="item" @select="openComposer" @updated="updateNote" @deleted="removeNote" />
		</UScrollArea>
		<div class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
			<NoteNewButton @click="openComposer" />
		</div>
	</div>
	<ChatSidebar />
</template>
