<script setup lang="ts">
const appConfig = useAppConfig()
const session = useAuth().useSession()

const signedIn = computed(() => Boolean(session.value.data?.user?.id))

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
	<template v-if="signedIn">
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
</template>
