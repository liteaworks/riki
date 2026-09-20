<script setup lang="ts">
import type { DropdownMenuItem, EditorToolbarItem } from '@nuxt/ui'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{
	created: [note: unknown]
}>()

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()

const content = ref('')
const sending = ref(false)

const editorRef = useTemplateRef<any>('editorRef')
const editor = computed(() => editorRef.value?.editor)

const isEmpty = computed(() => !content.value.trim())
const charCount = computed(() => content.value.trim().length)

const toolbarItems: EditorToolbarItem[][] = [
	[
		{ kind: 'heading', level: 1, icon: appConfig.ui.icons.heading },
		{ kind: 'mark', mark: 'bold', icon: appConfig.ui.icons.bold },
		{ kind: 'mark', mark: 'italic', icon: appConfig.ui.icons.italic },
		{ kind: 'bulletList', icon: appConfig.ui.icons.bulletList },
		{ kind: 'orderedList', icon: appConfig.ui.icons.orderedList },
		{ kind: 'codeBlock', icon: appConfig.ui.icons.code },
	],
]

const addItems = computed<DropdownMenuItem[][]>(() => [
	[{ label: t('note.attachLocation'), icon: appConfig.ui.icons.mapPin, disabled: true }],
])

const actionItems = computed<DropdownMenuItem[][]>(() => [
	[{ type: 'label', label: t('note.wordCount', { count: charCount.value }) }],
])

async function handleSend() {
	if (isEmpty.value || sending.value) return
	sending.value = true
	try {
		const note = await $fetch('/api/notes', {
			method: 'POST',
			body: { content: content.value.trim(), spaceId: null },
		})
		content.value = ''
		open.value = false
		emit('created', note)
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
			<ClientOnly>
				<UEditor
					ref="editorRef"
					v-model="content"
					content-type="markdown"
					:placeholder="t('note.editorPlaceholder')"
					class="min-h-48 w-full"
				/>
				<template #fallback>
					<USkeleton class="h-48 w-full" />
				</template>
			</ClientOnly>
		</template>
		<template #footer>
			<div class="flex w-full items-center gap-1">
				<UDropdownMenu :items="addItems" :content="{ align: 'start', side: 'top' }">
					<UButton :icon="appConfig.ui.icons.plus" color="neutral" variant="ghost" size="sm" />
				</UDropdownMenu>
				<UTooltip :text="t('note.inbox')">
					<span class="inline-flex">
						<UButton
							:icon="appConfig.ui.icons.inbox"
							color="neutral"
							variant="ghost"
							size="sm"
							disabled
						/>
					</span>
				</UTooltip>
				<UTooltip :text="t('note.attachImage')">
					<span class="inline-flex">
						<UButton
							:icon="appConfig.ui.icons.image"
							color="neutral"
							variant="ghost"
							size="sm"
							disabled
						/>
					</span>
				</UTooltip>
				<UTooltip :text="t('note.attachAudio')">
					<span class="inline-flex">
						<UButton
							:icon="appConfig.ui.icons.waveform"
							color="neutral"
							variant="ghost"
							size="sm"
							disabled
						/>
					</span>
				</UTooltip>
				<UFieldGroup size="sm" class="ml-auto">
					<UButton :label="t('note.send')" variant="soft" :loading="sending" @click="handleSend" />
					<UDropdownMenu :items="actionItems" :content="{ align: 'end', side: 'top' }">
						<UButton :icon="appConfig.ui.icons.chevronDown" variant="soft" />
					</UDropdownMenu>
				</UFieldGroup>
			</div>
		</template>
	</UModal>
</template>
