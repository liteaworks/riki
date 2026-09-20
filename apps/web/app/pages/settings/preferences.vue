<script setup lang="ts">
const settingsStore = useSettingsStore()
const { state } = storeToRefs(settingsStore)

const appConfig = useAppConfig()
</script>

<template>
	<SettingsItemGroup :label="$t('settings.preferences.general')">
		<SettingsItem :label="$t('settings.preferences.language')" :icon="appConfig.ui.icons.globe">
			<SettingsLocaleSelect v-model="state.locale" />
		</SettingsItem>
	</SettingsItemGroup>
	<SettingsItemGroup :label="$t('settings.preferences.color')">
		<SettingsItem
			:label="$t('settings.preferences.colorMode.label')"
			:icon="appConfig.ui.icons.colorMode"
		>
			<SettingsColorModeTabs v-model="state.colorMode" />
		</SettingsItem>
	</SettingsItemGroup>
</template>
