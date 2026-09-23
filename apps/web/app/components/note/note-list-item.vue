<script setup lang="ts">
import { NoteLink, NoteTag } from '#components'
import type { Note } from '#shared/types/note'

const props = defineProps<{
	note: Note
}>()

const emit = defineEmits<{
	select: [note: Note]
}>()

const markdownComponents = { a: NoteLink, tag: NoteTag }

const { locale } = useI18n()

const relativeTime = computed(() => formatRelativeTime(props.note.createdAt, locale.value))
const absoluteHint = computed(() => {
	const createdAt = $t('note.createdAt', {
		time: formatAbsoluteTime(props.note.createdAt, locale.value),
	})
	const createdSecond = Math.floor(new Date(props.note.createdAt).getTime() / 1000)
	const updatedSecond = Math.floor(new Date(props.note.updatedAt).getTime() / 1000)
	if (updatedSecond === createdSecond) return createdAt
	return `${createdAt}\n${$t('note.updatedAt', { time: formatAbsoluteTime(props.note.updatedAt, locale.value) })}`
})
</script>

<template>
	<div
		class="group/note-item-card flex w-full cursor-pointer flex-col rounded-2xl bg-muted p-1 select-text dark:bg-muted/50"
		@click="emit('select', props.note)"
	>
		<article class="h-full rounded-xl bg-default p-2 py-1">
			<Markdown :value="props.note.content" :components="markdownComponents" />
		</article>
		<div class="flex items-center justify-between gap-2 pl-2 text-xs text-muted sm:py-1 sm:text-sm">
			<div class="flex gap-1 truncate">
				<UTooltip :text="absoluteHint" :ui="{ content: 'whitespace-pre-line' }">
					<span>{{ relativeTime }}</span>
				</UTooltip>
			</div>
		</div>
	</div>
</template>
