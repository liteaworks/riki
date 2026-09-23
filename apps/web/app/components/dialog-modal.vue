<script setup lang="ts">
const props = defineProps<{
	title?: string
	description?: string
	icon?: string
	destructive?: boolean
	onConfirm?: () => void
}>()

const emit = defineEmits<{
	close: []
}>()

function handleConfirm() {
	props.onConfirm?.()
	emit('close')
}
</script>

<template>
	<UModal :close="{ onClick: () => emit('close') }">
		<template #header>
			<div class="flex w-full flex-col items-center text-center">
				<div
					v-if="icon"
					class="mb-2 inline-flex size-10 items-center justify-center rounded-full"
					:class="destructive ? 'bg-error/10 text-error dark:bg-error/25' : 'bg-muted'"
				>
					<UIcon :name="icon" class="size-6" />
				</div>
				<span v-if="title" class="font-semibold">{{ title }}</span>
				<span v-if="description" class="mt-1 text-sm text-balance text-muted md:text-pretty">
					{{ description }}
				</span>
			</div>
		</template>

		<template v-if="$slots.default" #body>
			<slot />
		</template>

		<template #footer>
			<UButton
				:label="$t('common.cancel')"
				color="neutral"
				variant="subtle"
				block
				@click="emit('close')"
			/>
			<UButton
				:label="$t('common.confirm')"
				block
				:color="destructive ? 'error' : 'primary'"
				@click="handleConfirm"
			/>
		</template>
	</UModal>
</template>
