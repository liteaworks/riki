import type { NuxtI18nOptions } from '@nuxtjs/i18n'
import type { I18nOptions } from 'vue-i18n'
import { defaultLocale } from './locales'

export default {
	detectBrowserLanguage: {
		fallbackLocale: defaultLocale,
	},
	strategy: 'no_prefix',
	defaultLocale,
	fallbackLocale: {
		'zh-CN': ['zh-Hans', 'zh-Hant'],
		'zh-SG': ['zh-Hans', 'zh-Hant'],
		zh: ['zh-Hans', 'zh-Hant'],
		'zh-TW': ['zh-Hant', 'zh-Hans'],
		'zh-HK': ['yue', 'zh-Hant', 'zh-Hans'],
		'zh-MO': ['yue', 'zh-Hant', 'zh-Hans'],
		yue: ['zh-Hant', 'zh-Hans'],
		default: [defaultLocale],
	},
} satisfies I18nOptions & NuxtI18nOptions
