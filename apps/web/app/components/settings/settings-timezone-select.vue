<script lang="ts" setup>
const { locale: currentLocale } = useI18n()
const model = defineModel<string>()

function offsetLabel(timeZone: string, date: Date): string {
	return (
		new Intl.DateTimeFormat(currentLocale.value, {
			timeZone,
			timeZoneName: 'shortOffset',
		})
			.formatToParts(date)
			.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'
	)
}

function displayName(timeZone: string, date: Date): string {
	return (
		new Intl.DateTimeFormat(currentLocale.value, {
			timeZone,
			timeZoneName: 'longGeneric',
		})
			.formatToParts(date)
			.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
	)
}

function cityLabel(timeZone: string): string {
	return timeZone.split('/').pop()!.replaceAll('_', ' ')
}

const processedTimeZones = computed(() => {
	const now = new Date()
	const systemZone = Intl.DateTimeFormat().resolvedOptions().timeZone
	const preferred = new Set(
		(new Intl.Locale(resolveLocale(currentLocale.value)) as any).getTimeZones?.() ?? [],
	)
	const isEnglish = currentLocale.value.startsWith('en')
	const seen = new Set<string>()
	const zones = Intl.supportedValuesOf('timeZone')
		.map((code) => {
			const name = displayName(code, now)
			return {
				code,
				name: isEnglish ? cityLabel(code) : name,
				description: isEnglish ? `${offsetLabel(code, now)} - ${name}` : offsetLabel(code, now),
				offset: offsetLabel(code, now),
				isPreferred: preferred.has(code),
			}
		})
		.sort((a, b) => {
			if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
			return a.offset.localeCompare(b.offset, undefined, { numeric: true })
		})
		.filter((zone) => {
			if (seen.has(zone.name)) return false
			seen.add(zone.name)
			return true
		})
	return [
		{
			code: 'system',
			name: $t('settings.followSystem'),
			description: systemZone ? displayName(systemZone, now) : undefined,
		},
		...zones.map(({ code, name, description }) => ({ code, name, description })),
	]
})
</script>

<template>
	<USelectMenu
		v-model="model"
		:items="processedTimeZones"
		label-key="name"
		value-key="code"
		description-key="description"
		:search-input="{
			placeholder: $t('common.searchLabelPlaceholder', {
				label: $t('settings.preferences.timeZone'),
			}),
		}"
		:ui="{ itemLabel: 'text-sm', itemDescription: 'text-xs' }"
	/>
</template>
