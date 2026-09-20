<script lang="ts" setup>
import type { AvailableLocales } from '~~/i18n/locales'
import { availableLocales } from '~~/i18n/locales'

const { locale: currentLocale } = useI18n()

const model = defineModel<AvailableLocales>()

const processedLocales = computed(() => {
	return availableLocales.map((locale) => {
		const name = new Intl.DisplayNames(currentLocale.value, {
			type: 'language',
			languageDisplay: 'dialect',
		}).of(locale.code)

		return {
			...locale,
			displayName: currentLocale.value === locale.code ? undefined : name,
		}
	})
})
</script>

<template>
	<USelectMenu
		v-model="model"
		:items="processedLocales"
		label-key="name"
		value-key="code"
		description-key="displayName"
		:search-input="{
			placeholder: $t('common.searchLabelPlaceholder', {
				label: $t('settings.preferences.language'),
			}),
		}"
		:ui="{ itemLabel: 'text-sm', itemDescription: 'text-xs' }"
	/>
</template>
