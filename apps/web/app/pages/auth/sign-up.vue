<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()
const appConfig = useAppConfig()
const authClient = useAuth()

const nameLabel = t('auth.name')
const usernameLabel = t('auth.username')
const emailLabel = t('auth.email')
const passwordLabel = t('auth.password')

const schema = z.object({
	name: z
		.string(t('common.required', { label: nameLabel }))
		.trim()
		.min(1, t('common.required', { label: nameLabel }))
		.max(64, t('common.lengthBetween', { label: nameLabel, min: 1, max: 64 })),
	username: z
		.string(t('common.required', { label: usernameLabel }))
		.trim()
		.min(3, t('common.lengthBetween', { label: usernameLabel, min: 3, max: 30 }))
		.max(30, t('common.lengthBetween', { label: usernameLabel, min: 3, max: 30 })),
	email: z.email(t('common.invalid', { label: emailLabel })),
	password: z
		.string(t('common.required', { label: passwordLabel }))
		.min(8, t('common.lengthBetween', { label: passwordLabel, min: 8, max: 128 }))
		.max(128, t('common.lengthBetween', { label: passwordLabel, min: 8, max: 128 })),
})

type Schema = z.output<typeof schema>

const fields = computed<AuthFormField[]>(() => [
	{
		name: 'name',
		type: 'text',
		label: t('auth.name'),
		placeholder: t('common.placeholder', { label: t('auth.name') }),
		required: true,
		autocomplete: 'name',
	},
	{
		name: 'username',
		type: 'text',
		label: t('auth.username'),
		placeholder: t('common.placeholder', { label: t('auth.username') }),
		required: true,
		autocomplete: 'username',
	},
	{
		name: 'email',
		type: 'email',
		label: t('auth.email'),
		placeholder: t('common.placeholder', { label: t('auth.email') }),
		required: true,
		autocomplete: 'email',
	},
	{
		name: 'password',
		type: 'password',
		label: t('auth.password'),
		placeholder: t('common.placeholder', { label: t('auth.password') }),
		required: true,
		autocomplete: 'new-password',
	},
])

async function handleSignUp(data: Schema) {
	return await authClient.signUp.email({
		name: data.name.trim(),
		username: data.username.trim(),
		email: data.email.trim(),
		password: data.password,
	})
}
</script>

<template>
	<AuthForm
		:schema="schema"
		:fields="fields"
		:title="$t('auth.signUpTitle')"
		:description="$t('auth.signUpDescription')"
		:description-link-to="appConfig.routes.auth.signIn"
		:description-link-label="$t('auth.signIn')"
		:submit-label="$t('auth.signUp')"
		:action="$t('auth.signUp')"
		:handler="handleSignUp"
	/>
</template>
