<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const authClient = useAuth()

const session = authClient.useSession()
const user = computed(() => session.value.data?.user ?? null)

async function handleSignOut() {
	const { error } = await authClient.signOut()
	if (error) {
		toast.add({
			title: t('common.actionFailed', { action: t('auth.signOut') }),
			description: error.message,
			color: 'error',
		})
		return
	}
	await navigateTo(appConfig.routes.auth.signIn)
}

const baseItems = computed<DropdownMenuItem[]>(() => [
	{
		label: t('settings.label'),
		icon: appConfig.ui.icons.settings,
		to: appConfig.routes.settings.general,
	},
])

const dropdownMenuItems = computed<DropdownMenuItem[][]>(() => {
	if (!user.value) {
		return [
			[
				{
					label: t('auth.signIn'),
					icon: appConfig.ui.icons.signIn,
					to: appConfig.routes.auth.signIn,
				},
			],
			baseItems.value,
		]
	}
	return [
		[
			{
				label: user.value.name,
				avatar: { src: user.value.image ?? undefined, alt: user.value.name },
				class: 'truncate',
			},
		],
		baseItems.value,
		[
			{
				label: t('auth.signOut'),
				icon: appConfig.ui.icons.signOut,
				onSelect: handleSignOut,
			},
		],
	]
})
</script>

<template>
	<UDropdownMenu :items="dropdownMenuItems" :ui="{ content: 'w-3xs' }">
		<UTooltip :text="$t('header.openAppMenu')">
			<UButton :icon="appConfig.ui.icons.menu" color="neutral" variant="ghost" />
		</UTooltip>
	</UDropdownMenu>
</template>
