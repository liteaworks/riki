<script setup lang="ts">
import { noteVisibility } from '#shared/types/note'
import type { Note, NoteVisibility } from '#shared/types/note'
import type { DropdownMenuItem } from '@nuxt/ui'
import { tagMention } from '~/utils/tiptap-tag'

const props = defineProps<{
	note?: Note | null
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const noteStore = useNoteStore()
const draftStore = useDraftStore()

const content = ref('')
const spaceId = ref<string | null>(null)
const visibility = ref<NoteVisibility>(noteVisibility.private)
const sending = ref(false)

const draftScope = computed(() => draftStore.scopeFor(props.note?.id))
const baseline = computed(() => props.note?.content ?? '')

watch(
	() => open.value,
	(isOpen) => {
		if (!isOpen) return
		content.value = draftStore.load(draftScope.value) || baseline.value
		spaceId.value = props.note?.spaceId ?? null
		visibility.value = props.note?.visibility ?? noteVisibility.private
	},
	{ immediate: true },
)

watch(content, (value) => {
	if (!open.value) return
	if (value === baseline.value) {
		draftStore.discard(draftScope.value)
		return
	}
	draftStore.save(draftScope.value, value)
})

const editorRef = useTemplateRef<any>('editorRef')
const editor = computed(() => editorRef.value?.editor)

const isEmpty = computed(() => !content.value.trim())

const toolbarItems = [
	{ kind: 'heading', level: 1, icon: appConfig.ui.icons.heading },
	{ kind: 'mark', mark: 'bold', icon: appConfig.ui.icons.bold },
	{ kind: 'mark', mark: 'italic', icon: appConfig.ui.icons.italic },
	{ kind: 'bulletList', icon: appConfig.ui.icons.bulletList },
	{ kind: 'orderedList', icon: appConfig.ui.icons.orderedList },
	{ kind: 'codeBlock', icon: appConfig.ui.icons.code },
]

const addItems = computed<DropdownMenuItem[][]>(() => [
	[
		{
			label: t('note.attachImage'),
			icon: appConfig.ui.icons.image,
		},
		{
			label: t('note.attachAudio'),
			icon: appConfig.ui.icons.waveform,
		},
		{
			label: t('note.attachLocation'),
			icon: appConfig.ui.icons.mapPin,
		},
	],
])

const visibilityOptions = [
	{ value: noteVisibility.private, label: 'note.visibilityPrivate', icon: 'lock' },
	{ value: noteVisibility.protected, label: 'note.visibilityProtected', icon: 'user' },
	{ value: noteVisibility.public, label: 'note.visibilityPublic', icon: 'globe' },
] as const

const visibilityItems = computed<DropdownMenuItem[][]>(() => [
	visibilityOptions.map((option) => ({
		type: 'checkbox' as const,
		label: t(option.label),
		icon: appConfig.ui.icons[option.icon],
		checked: visibility.value === option.value,
		onSelect: () => {
			visibility.value = option.value
		},
	})),
])

const currentVisibility = computed(() =>
	visibilityOptions.find((option) => option.value === visibility.value)!,
)

const submitLabel = computed(() => {
	const publishing = visibility.value === noteVisibility.public
	if (!props.note?.id) return publishing ? t('note.publish') : t('note.send')
	return publishing && props.note.visibility !== noteVisibility.public
		? t('note.publish')
		: t('note.save')
})

async function handleSend() {
	if (isEmpty.value || sending.value) return
	sending.value = true
	try {
		const trimmed = content.value.trim()
		const body = {
			content: trimmed,
			spaceId: spaceId.value,
			tagNames: extractTagNames(editor.value),
			visibility: visibility.value,
		}
		if (props.note?.id) await noteStore.update(props.note.id, body)
		else await noteStore.create(body)
		content.value = ''
		draftStore.discard(draftScope.value)
		open.value = false
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: t('note.send') }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	} finally {
		sending.value = false
	}
}
</script>

<template>
	<UModal v-model:open="open">
		<template #title>
			<UEditorToolbar v-if="editor" :editor="editor" :items="toolbarItems" class="w-full" />
		</template>
		<template #body>
			<UEditor
				ref="editorRef"
				v-model="content"
				content-type="markdown"
				:placeholder="t('note.editorPlaceholder')"
				:mention="false"
				:extensions="[tagMention]"
				class="min-h-48 w-full"
			>
				<NoteTagMenu :editor="editor" />
			</UEditor>
		</template>
		<template #footer>
			<div class="flex w-full items-center gap-1">
				<UDropdownMenu :items="addItems" :content="{ align: 'start', side: 'top' }">
					<UButton :icon="appConfig.ui.icons.plus" color="neutral" variant="ghost" />
				</UDropdownMenu>
				<NoteSpaceMenu v-model="spaceId" />
				<UFieldGroup class="ml-auto">
					<UButton :label="submitLabel" variant="soft" :loading="sending" @click="handleSend" />
					<UDropdownMenu :items="visibilityItems" :content="{ align: 'end', side: 'top' }">
						<UTooltip :text="t(currentVisibility.label)">
							<UButton
								:icon="appConfig.ui.icons.chevronDown"
								:aria-label="t('note.visibilityLabel')"
								variant="soft"
							/>
						</UTooltip>
					</UDropdownMenu>
				</UFieldGroup>
			</div>
		</template>
	</UModal>
</template>
