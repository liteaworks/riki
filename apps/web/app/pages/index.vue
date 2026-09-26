<script setup lang="ts">
const noteStore = useNoteStore()
const { notes } = storeToRefs(noteStore)

const scrollArea = useTemplateRef<{
	$el: HTMLElement
	virtualizer?: { scrollToIndex: (index: number, options?: Record<string, unknown>) => void }
}>('scrollArea')

function scrollToTop() {
	scrollArea.value?.virtualizer?.scrollToIndex(0, { align: 'start' })
}

onMounted(() => {
	void noteStore.loadMore()
	useInfiniteScroll(
		() => scrollArea.value?.$el,
		() => void noteStore.loadMore(),
		{ distance: 200 },
	)
})

watch(() => notes.value[0]?.id, scrollToTop)
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
			<NoteListItem :note="item" @select="openComposer" />
		</UScrollArea>
		<div class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 sm:hidden">
			<NoteNewButton />
		</div>
	</div>
	<ChatSidebar />
</template>
