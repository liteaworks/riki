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

const isEditing = computed(() => Boolean(props.space))
const title = computed(() => (isEditing.value ? t('space.editTitle') : t('space.createTitle')))
const description = computed(() =>
	isEditing.value ? t('space.editDescription') : t('space.createDescription'),
)
const confirmLabel = computed(() => (isEditing.value ? t('common.save') : t('space.create')))

async function handleConfirm() {
	const value = name.value.trim()
	if (!value || saving.value) return
	saving.value = true
	try {
		// Written straight to the store: the sidebar and the composer's picker both
		// read this array, so a callback prop would have to cross the overlay to reach them.
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
		open.value = false
	} catch (error) {
		toast.add({
			title: t('common.actionFailed', { action: confirmLabel.value }),
			description: error instanceof Error ? error.message : undefined,
			color: 'error',
		})
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<UModal v-model:open="open">
		<template #header>
			<div class="flex w-full flex-col items-center text-center">
				<div class="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-muted">
					<UIcon :name="appConfig.ui.icons.folder" class="size-6" />
				</div>
				<span class="font-semibold">{{ title }}</span>
				<span class="mt-1 text-sm text-balance text-muted md:text-pretty">
					{{ description }}
				</span>
			</div>
		</template>

		<template #body>
			<UFormField :label="t('space.name')" :hint="t('common.required', { label: t('space.name') })">
				<UInput
					v-model="name"
					:placeholder="t('common.placeholder', { label: t('space.name') })"
					class="w-full"
					maxlength="64"
					@keydown.enter="handleConfirm"
				/>
			</UFormField>
		</template>

		<template #footer>
			<UButton
				:label="$t('common.cancel')"
				color="neutral"
				variant="subtle"
				block
				@click="open = false"
			/>
			<UButton
				:label="confirmLabel"
				block
				:loading="saving"
				:disabled="!name.trim()"
				@click="handleConfirm"
			/>
		</template>
	</UModal>
</template>
