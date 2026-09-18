<script setup lang="ts">
import type { AuthFormField } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()
const appConfig = useAppConfig()
const authClient = useAuth()

const emailSchema = z.email()
const identifierLabel = t('auth.identifier')
const passwordLabel = t('auth.password')
const passwordLength = t('common.lengthBetween', { label: passwordLabel, min: 8, max: 128 })

function isEmail(value: string) {
	return value.includes('@')
}

const schema = z.object({
	identifier: z
		.string(t('common.required', { label: identifierLabel }))
		.trim()
		.min(1, t('common.required', { label: identifierLabel }))
		.refine(
			(val) => {
				if (isEmail(val)) return emailSchema.safeParse(val).success
				return val.length >= 3 && val.length <= 30
			},
			{ message: t('common.invalid', { label: identifierLabel }) },
		),
	password: z
		.string(t('common.required', { label: passwordLabel }))
		.min(8, passwordLength)
		.max(128, passwordLength),
})

type Schema = z.output<typeof schema>

const fields = computed<AuthFormField[]>(() => [
	{
		name: 'identifier',
		type: 'text',
		label: t('auth.identifier'),
		placeholder: t('common.placeholder', { label: t('auth.identifier') }),
		required: true,
		autocomplete: 'username',
	},
	{
		name: 'password',
		type: 'password',
		label: t('auth.password'),
		placeholder: t('common.placeholder', { label: t('auth.password') }),
		required: true,
	},
])

async function handleSignIn(data: Schema) {
	const identifier = data.identifier.trim()
	return isEmail(identifier)
		? await authClient.signIn.email({ email: identifier, password: data.password })
		: await authClient.signIn.username({ username: identifier, password: data.password })
}
</script>

<template>
	<AuthForm
		:schema="schema"
		:fields="fields"
		:title="$t('auth.signInTitle')"
		:description="$t('auth.signInDescription')"
		:description-link-to="appConfig.routes.auth.signUp"
		:description-link-label="$t('auth.signUp')"
		:submit-label="$t('auth.signIn')"
		:action="$t('auth.signIn')"
		:handler="handleSignIn"
	/>
</template>
