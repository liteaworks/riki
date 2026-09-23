<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
	<UButton
		:icon="appConfig.ui.icons.plus"
		:label="$t('note.newNote')"
		color="primary"
		variant="soft"
		size="lg"
		class="rounded-full"
	/>
</template>
