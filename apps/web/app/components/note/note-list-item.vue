<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import { LazyDialogModal, NoteLink, NoteTag } from '#components'
import { noteStatus } from '#shared/types/note'
import type { NoteListItem, NoteStatus } from '#shared/types/note'

const props = defineProps<{
	note: NoteListItem
}>()

const emit = defineEmits<{
	select: [note: NoteListItem]
}>()

const { t } = useI18n()
const toast = useToast()
const overlay = useOverlay()
const appConfig = useAppConfig()
const noteStore = useNoteStore()
const draftStore = useDraftStore()

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
		await noteStore.setStatus(props.note.id, status)
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
		await noteStore.remove(props.note.id)
		// The note is gone for good, so its draft would be unreachable anyway.
		draftStore.discard(draftStore.scopeFor(props.note.id))
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: t('common.delete') }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	}
}

const markdownComponents = { a: NoteLink, tag: NoteTag }

const isUnsynced = computed(() => noteStore.isPending(props.note.id))
const draftScope = computed(() => draftStore.scopeFor(props.note.id))
const hasDraft = computed(() => draftStore.isDirty(draftScope.value, props.note.content))

function onRetry() {
	void noteStore.retryNote(props.note.id)
}

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
			<div class="flex items-center gap-2 pl-2 text-xs text-muted sm:py-1 sm:text-sm">
				<div class="flex items-center gap-1 truncate">
					<UTooltip v-if="hasDraft" :text="$t('note.draft')">
						<UIcon :name="appConfig.ui.icons.draft" class="size-3.5 shrink-0 text-warning" />
					</UTooltip>
					<UTooltip v-if="isUnsynced" :text="$t('note.unsynced')">
						<UButton
							color="warning"
							variant="link"
							size="xs"
							class="-my-1 px-1"
							:icon="appConfig.ui.icons.cloudUpload"
							@click.stop="onRetry"
						/>
					</UTooltip>
					<UTooltip :text="absoluteHint" :ui="{ content: 'whitespace-pre-line' }">
						<span>{{ relativeTime }}</span>
					</UTooltip>
				</div>
				<div v-if="props.note.spaceName" class="flex shrink-0 items-center gap-1">
					<UIcon :name="appConfig.ui.icons.folder" class="size-3.5" />
					<span class="max-w-24 truncate">{{ props.note.spaceName }}</span>
				</div>
			</div>
		</div>
	</UContextMenu>
</template>
