<script setup lang="ts">
import { LazyNoteEditorModal } from '#components'

const appConfig = useAppConfig()
const overlay = useOverlay()

const modal = overlay.create(LazyNoteEditorModal)
</script>

<template>
	<UButton
		:icon="appConfig.ui.icons.plus"
		:label="$t('note.newNote')"
		color="primary"
		variant="soft"
		size="lg"
		class="rounded-full"
		@click="modal.open"
	/>
</template>
