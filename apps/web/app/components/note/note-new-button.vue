<script setup lang="ts">
const appConfig = useAppConfig()

const { openComposer } = useNotes()

withDefaults(
	defineProps<{
		variant?: 'full' | 'ghost'
	}>(),
	{
		variant: 'full',
	},
)
</script>

<template>
	<UButton
		v-if="variant === 'full'"
		:icon="appConfig.ui.icons.plus"
		:label="$t('note.newNote')"
		color="primary"
		variant="soft"
		size="lg"
		class="rounded-full"
		@click="() => openComposer()"
	/>
	<UTooltip v-else :text="$t('note.newNote')">
		<UButton
			:icon="appConfig.ui.icons.plus"
			color="neutral"
			variant="ghost"
			@click="() => openComposer()"
		/>
	</UTooltip>
</template>
