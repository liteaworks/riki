<script setup lang="ts">
import type { View } from '#shared/types/view'
import type { ViewFilter } from '#shared/types/view'
import { noteVisibility, noteVisibilityValues } from '#shared/types/note'
import type { NoteVisibility } from '#shared/types/note'

const props = defineProps<{
	view?: View | null
	filter?: ViewFilter
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const viewStore = useViewStore()
const noteStore = useNoteStore()
const tagStore = useTagStore()

const name = ref('')
const saving = ref(false)
const spaceId = ref<string | null>(null)
const tagIds = ref<string[]>([])
const visibility = ref<NoteVisibility[]>([])
const pinnedOnly = ref(false)

const isEditing = computed(() => Boolean(props.view))
const title = computed(() => (isEditing.value ? t('view.editTitle') : t('view.createTitle')))
const description = computed(() =>
	isEditing.value ? t('view.editDescription') : t('view.createDescription'),
)

watch(
	() => open.value,
	(isOpen) => {
		if (!isOpen) return
		const filter = props.view?.filter ?? props.filter ?? {}
		name.value = props.view?.name ?? ''
		spaceId.value = filter.spaceId ?? null
		tagIds.value = [...(filter.tagIds ?? [])]
		visibility.value = [...(filter.visibility ?? [])]
		pinnedOnly.value = filter.pinnedOnly ?? false
	},
	{ immediate: true },
)

function visibilityLabel(value: NoteVisibility) {
	return t(`note.visibility${value[0]!.toUpperCase()}${value.slice(1)}`)
}

function toggleVisibility(value: NoteVisibility) {
	visibility.value = visibility.value.includes(value)
		? visibility.value.filter((item) => item !== value)
		: [...visibility.value, value]
}

function buildFilter(): ViewFilter {
	return {
		...(spaceId.value !== null && { spaceId: spaceId.value }),
		...(tagIds.value.length && { tagIds: tagIds.value }),
		...(visibility.value.length && { visibility: visibility.value }),
		...(pinnedOnly.value && { pinnedOnly: true }),
	}
}

async function handleConfirm() {
	const value = name.value.trim()
	if (!value || saving.value) return
	saving.value = true
	try {
		const filter = buildFilter()
		if (props.view) await viewStore.saveView(props.view.id, value, filter)
		else {
			await viewStore.createView(value, filter)
			noteStore.resetFilter()
		}
		open.value = false
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: title.value }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<DialogModal
		v-model:open="open"
		:title="title"
		:description="description"
		:icon="appConfig.ui.icons.file"
		:on-confirm="handleConfirm"
		@close="open = false"
	>
		<div class="flex flex-col gap-3">
			<UFormField :label="t('view.name')" :hint="t('common.required', { label: t('view.name') })">
				<UInput
					v-model="name"
					:placeholder="t('common.placeholder', { label: t('view.name') })"
					class="w-full"
					maxlength="64"
					@keydown.enter="handleConfirm"
				/>
			</UFormField>

			<NoteSpaceMenu v-model="spaceId" />

			<USelectMenu
				v-model="tagIds"
				multiple
				:items="tagStore.tags"
				value-key="id"
				:placeholder="t('view.tags')"
				class="w-full"
			/>

			<div class="flex flex-col gap-1">
				<span class="text-sm font-medium">{{ t('note.visibilityLabel') }}</span>
				<UCheckbox
					v-for="value in noteVisibilityValues"
					:key="value"
					:model-value="visibility.includes(value)"
					:label="visibilityLabel(value)"
					@update:model-value="toggleVisibility(value)"
				/>
			</div>

			<UCheckbox v-model="pinnedOnly" :label="t('view.pinnedOnly')" />
		</div>
	</DialogModal>
</template>
