<script setup lang="ts">
import type { Messages } from '@nuxt/ui'

const ui = {
	button: {
		base: 'cursor-pointer',
	},
	navigationMenu: {
		link: 'cursor-pointer',
	},
	...(isTauri && {
		sidebar: {
			gap: 'h-[calc(100%-var(--ui-header-height))]',
			container:
				'absolute top-(--ui-header-height) bottom-0 h-[calc(100%-var(--ui-header-height))]',
		},
	}),
}

const toaster = { expand: false, progress: false }

const { locale: currentLocale } = useI18n()

const locale = defineLocale<Messages>({
	name: currentLocale.value,
	code: currentLocale.value,
	messages: {
		alert: {
			close: $t('common.close'),
		},
		authForm: {
			hidePassword: '',
			showPassword: '',
			submit: '',
		},
		banner: {
			close: $t('common.close'),
		},
		calendar: {
			nextMonth: '',
			nextYear: '',
			prevMonth: '',
			prevYear: '',
		},
		carousel: {
			dots: '',
			goto: '',
			next: '',
			prev: '',
		},
		chatPrompt: {
			placeholder: '',
		},
		chatPromptSubmit: {
			label: '',
		},
		colorMode: {
			dark: $t('settings.preferences.colorMode.dark'),
			light: $t('settings.preferences.colorMode.light'),
			system: $t('settings.preferences.colorMode.system'),
			switchToDark: '',
			switchToLight: '',
		},
		commandPalette: {
			back: '',
			close: $t('common.close'),
			noData: $t('common.noData'),
			noMatch: $t('common.noMatch'),
			placeholder: '',
		},
		contentSearch: {
			links: '',
			search: '',
			theme: '',
		},
		contentSearchButton: {
			label: '',
		},
		contentToc: {
			title: '',
		},
		dropdownMenu: {
			noMatch: $t('common.noMatch'),
			search: '',
		},
		dashboardSearch: {
			theme: '',
		},
		dashboardSearchButton: {
			label: '',
		},
		dashboardSidebarCollapse: {
			collapse: '',
			expand: '',
		},
		dashboardSidebarToggle: {
			close: '',
			open: '',
		},
		drawer: {
			close: $t('common.close'),
		},
		error: {
			clear: '',
		},
		fileUpload: {
			removeFile: '',
		},
		header: {
			close: $t('common.close'),
			open: $t('common.toggle'),
		},
		inputMenu: {
			create: '',
			noData: $t('common.noData'),
			noMatch: $t('common.noMatch'),
		},
		inputNumber: {
			decrement: '',
			increment: '',
		},
		listbox: {
			noData: $t('common.noData'),
			noMatch: $t('common.noMatch'),
			search: '',
		},
		modal: {
			close: $t('common.close'),
		},
		pricingTable: {
			caption: '',
		},
		prose: {
			codeCollapse: {
				closeText: '',
				name: '',
				openText: '',
			},
			collapsible: {
				closeText: '',
				name: '',
				openText: '',
			},
			pre: {
				copy: '',
			},
			prompt: {
				copy: '',
				openIn: '',
			},
		},
		chatReasoning: {
			thinking: '',
			thought: '',
			thoughtFor: '',
		},
		sidebar: {
			close: $t('common.close'),
			toggle: $t('common.toggle'),
		},
		selectMenu: {
			create: '',
			noData: $t('common.noData'),
			noMatch: $t('common.noMatch'),
			search: '',
		},
		slideover: {
			close: $t('common.close'),
		},
		table: {
			noData: $t('common.noData'),
		},
		toast: {
			close: $t('common.close'),
		},
	},
})
</script>

<template>
	<UApp :toaster="toaster" :locale="locale">
		<UTheme :ui="ui">
			<slot />
		</UTheme>
	</UApp>
</template>
