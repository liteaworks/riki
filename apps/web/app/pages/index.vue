<script setup lang="ts">
import { LazyNoteEditorModal } from '#components'
import type { ListNotesResponse, Note } from '#shared/types/note'

const overlay = useOverlay()
const editorModal = overlay.create(LazyNoteEditorModal)

const notes = ref<Note[]>([])
const nextCursor = ref<string | null>(null)
const pending = ref(false)

async function loadMore() {
	if (pending.value) return
	if (nextCursor.value === null && notes.value.length) return
	pending.value = true
	try {
		const data = await $fetch<ListNotesResponse>('/api/notes', {
			query: { limit: 20, ...(nextCursor.value ? { cursor: nextCursor.value } : {}) },
		})
		notes.value.push(...data.items)
		nextCursor.value = data.nextCursor
	} finally {
		pending.value = false
	}
}

function handleCreated(note: unknown) {
	notes.value.unshift(note as Note)
}

function openEditor(note?: Note) {
	editorModal.open({ note: note ?? null, onCreated: handleCreated })
}

const scrollArea = useTemplateRef<{ $el: HTMLElement }>('scrollArea')

onMounted(() => {
	loadMore()
	useInfiniteScroll(
		() => scrollArea.value?.$el,
		() => loadMore(),
		{ distance: 200 },
	)
})
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
			<NoteListItem :note="item" @select="openEditor" />
		</UScrollArea>
		<div class="absolute bottom-4 left-1/2 z-50 -translate-x-1/2">
			<NoteNewButton />
		</div>
	</div>
	<ChatSidebar />
</template>
