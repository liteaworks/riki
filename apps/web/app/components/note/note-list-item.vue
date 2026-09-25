<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import { LazyDialogModal, NoteLink, NoteTag } from '#components'
import { noteStatus } from '#shared/types/note'
import type { Note, NoteStatus } from '#shared/types/note'

const props = defineProps<{
	note: Note
}>()

const emit = defineEmits<{
	select: [note: Note]
	updated: [note: Note]
	deleted: [id: string]
}>()

const { t } = useI18n()
const toast = useToast()
const overlay = useOverlay()
const appConfig = useAppConfig()

const confirmDialog = overlay.create(LazyDialogModal)

const isPinned = computed(() => props.note.status === noteStatus.pinned)
const isArchived = computed(() => props.note.status === noteStatus.archived)

const menuItems = computed<ContextMenuItem[][]>(() => [
	[
		{
			label: isPinned.value ? t('note.unpin') : t('note.pin'),
			icon: appConfig.ui.icons.pin,
			onSelect: () =>
				toggleStatus(
					isPinned.value ? noteStatus.normal : noteStatus.pinned,
					isPinned.value ? t('note.unpin') : t('note.pin'),
				),
		},
		{
			label: isArchived.value ? t('note.unarchive') : t('note.archive'),
			icon: appConfig.ui.icons.archive,
			onSelect: () =>
				toggleStatus(
					isArchived.value ? noteStatus.normal : noteStatus.archived,
					isArchived.value ? t('note.unarchive') : t('note.archive'),
				),
		},
	],
	[
		{
			label: t('common.delete'),
			icon: appConfig.ui.icons.trash,
			color: 'error',
			onSelect: () => openDeleteDialog(),
		},
	],
])

async function toggleStatus(status: NoteStatus, action: string) {
	try {
		const updated = await $fetch<Note>(`/api/notes/${props.note.id}`, {
			method: 'PATCH',
			body: { status },
		})
		emit('updated', updated)
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	}
}

function openDeleteDialog() {
	confirmDialog.open({
		title: t('note.deleteTitle'),
		description: t('note.deleteDescription'),
		icon: appConfig.ui.icons.trash,
		destructive: true,
		onConfirm: () => {
			void handleDelete()
		},
	})
}

async function handleDelete() {
	try {
		await $fetch(`/api/notes/${props.note.id}`, { method: 'DELETE' })
		emit('deleted', props.note.id)
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: t('common.delete') }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	}
}

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
	<UContextMenu :items="menuItems">
		<div
			class="group/note-item-card flex w-full cursor-pointer flex-col rounded-2xl bg-muted p-1 select-text dark:bg-muted/50"
			@click="emit('select', props.note)"
		>
			<article class="h-full rounded-xl bg-default p-2 py-1">
				<Markdown :value="props.note.content" :components="markdownComponents" />
			</article>
			<div
				class="flex items-center justify-between gap-2 pl-2 text-xs text-muted sm:py-1 sm:text-sm"
			>
				<div class="flex gap-1 truncate">
					<UTooltip :text="absoluteHint" :ui="{ content: 'whitespace-pre-line' }">
						<span>{{ relativeTime }}</span>
					</UTooltip>
				</div>
			</div>
		</div>
	</UContextMenu>
</template>
