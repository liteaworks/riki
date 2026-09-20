import type { LocaleObject } from '@nuxtjs/i18n'

export const defaultLocale = 'en'

export const locales: LocaleObject[] = [
	{
		code: 'en',
		file: 'en-us.json',
		language: 'en',
		name: 'English',
	},
	{
		code: 'zh-Hans',
		file: 'zh-hans-cn.json',
		language: 'zh-CN',
		name: '简体中文',
	},
	{
		code: 'zh-Hant',
		file: 'zh-hant-tw.json',
		language: 'zh-TW',
		name: '正體中文',
	},
	{
		code: 'yue',
		file: 'zh-yue-hant.json',
		language: 'yue',
		name: '廣東話',
	},
	// {
	// 	code: 'lzh',
	// 	file: 'zh-lzh-hant.json',
	// 	language: 'lzh',
	// 	name: '文言',
	// },
]

export const availableLocales = [...locales].sort((a, b) => a.code.localeCompare(b.code))

export type AvailableLocales = (typeof locales)[number]['code']
