<script setup lang="ts">
const settingsStore = useSettingsStore()
const { state } = storeToRefs(settingsStore)

const appConfig = useAppConfig()
</script>

<template>
	<SettingsItemGroup :headline="$t('settings.general.languageAndTime')">
		<SettingsItem :label="$t('settings.general.language')" :icon="appConfig.ui.icons.globe">
			<SettingsLocaleSelect v-model="state.locale" />
		</SettingsItem>
		<SettingsItem :label="$t('settings.general.language')" :icon="appConfig.ui.icons.globe">
			<SettingsLocaleSelect v-model="state.locale" />
		</SettingsItem>
	</SettingsItemGroup>
	<SettingsItemGroup :headline="$t('settings.general.color')">
		<SettingsItem
			:label="$t('settings.general.colorMode.label')"
			:icon="appConfig.ui.icons.colorMode"
		>
			<SettingsColorModeTabs v-model="state.colorMode" />
		</SettingsItem>
	</SettingsItemGroup>
</template>
