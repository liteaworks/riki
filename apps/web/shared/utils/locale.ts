import { defaultLocale, locales } from '~~/i18n/locales'

export function resolveLocale(code: string): string {
	return locales.find((item) => item.code === code)?.language ?? defaultLocale
}
