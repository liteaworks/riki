<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { AuthFormField, ButtonProps, FormSubmitEvent } from '@nuxt/ui'
import type { ZodType } from 'zod'

const props = defineProps<{
	schema: ZodType<T>
	fields: AuthFormField[]
	title: string
	description: string
	descriptionLinkTo: string
	descriptionLinkLabel: string
	submitLabel: string
	/** Action name shown in the failure toast, e.g. "Sign in" */
	action: string
	/** Runs the better-auth call, resolves with its `{ error }` result */
	handler: (data: T) => Promise<{ error: { message?: string } | null }>
}>()

const { t } = useI18n()
const toast = useToast()
const appConfig = useAppConfig()
const authClient = useAuth()

const providers = computed<ButtonProps[]>(() => [
	{
		label: 'Google',
		icon: appConfig.ui.icons.googleLogo,
		color: 'neutral',
		variant: 'subtle',
		onClick: () => signInWithSocial('google'),
	},
	{
		label: 'GitHub',
		icon: appConfig.ui.icons.githubLogo,
		color: 'neutral',
		variant: 'subtle',
		onClick: () => signInWithSocial('github'),
	},
])

const loading = ref(false)

function failToast(message?: string) {
	toast.add({
		title: t('common.actionFailed', { action: props.action }),
		description: message,
		color: 'error',
	})
}

async function signInWithSocial(provider: 'google' | 'github') {
	const { error } = await authClient.signIn.social({ provider, callbackURL: '/' })
	if (error) failToast(error.message)
}

async function onSubmit(event: FormSubmitEvent<T>) {
	loading.value = true
	try {
		const { error } = await props.handler(event.data)
		if (error) {
			failToast(error.message)
			return
		}
		await navigateTo('/')
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<UAuthForm
		:schema="schema"
		:title="title"
		:fields="fields"
		:providers="providers"
		:separator="$t('auth.orContinueWith')"
		:submit="{ label: submitLabel }"
		:loading="loading"
		:validate-on="['change']"
		class="w-full max-w-sm"
		@submit="onSubmit"
	>
		<template #description>
			{{ description }}
			<ULink :to="descriptionLinkTo" class="font-medium text-primary">
				{{ descriptionLinkLabel }}
			</ULink>
		</template>
	</UAuthForm>
</template>
