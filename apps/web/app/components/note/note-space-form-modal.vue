<script setup lang="ts">
import type { Space } from '#shared/types/note'

const props = defineProps<{
	space?: Pick<Space, 'id' | 'name'> | null
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const spaceStore = useSpaceStore()

const name = ref('')
const saving = ref(false)

watch(
	() => open.value,
	(isOpen) => {
		if (isOpen) name.value = props.space?.name ?? ''
	},
	{ immediate: true },
)

const title = computed(() => (props.space ? t('space.editTitle') : t('space.createTitle')))
const description = computed(() =>
	props.space ? t('space.editDescription') : t('space.createDescription'),
)

async function handleConfirm() {
	const value = name.value.trim()
	if (!value || saving.value) return
	saving.value = true
	try {
		if (props.space) {
			const space = await $fetch<Space>(`/api/spaces/${props.space.id}`, {
				method: 'PATCH',
				body: { name: value },
			})
			spaceStore.renameSpace(space)
		} else {
			const space = await $fetch<Space>('/api/spaces', { method: 'POST', body: { name: value } })
			spaceStore.addSpace(space)
		}
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: t('space.create') }),
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
		:icon="appConfig.ui.icons.folder"
		:on-confirm="handleConfirm"
		@close="open = false"
	>
		<UFormField :label="t('space.name')" :hint="t('common.required', { label: t('space.name') })">
			<UInput
				v-model="name"
				:placeholder="t('common.placeholder', { label: t('space.name') })"
				class="w-full"
				maxlength="64"
				@keydown.enter="handleConfirm"
			/>
		</UFormField>
	</DialogModal>
</template>
