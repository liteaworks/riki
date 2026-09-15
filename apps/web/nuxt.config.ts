import { defaultLocale, locales } from './i18n/locales'

export default defineNuxtConfig({
	modules: [
		'@nuxt/ui',
		'@nuxtjs/i18n',
		'@nuxtjs/better-auth',
		'@nuxthub/core',
		'@vueuse/nuxt',
		'@pinia/nuxt',
	],
	css: ['~/assets/css/main.css'],
	hub: {
		db: 'sqlite',
	},
	i18n: {
		strategy: 'no_prefix',
		defaultLocale,
		locales,
	},
	icon: {
		clientBundle: {
			scan: true,
		},
	},
	ssr: false,
	vite: {
		clearScreen: false,
		envPrefix: ['VITE_', 'TAURI_'],
		server: {
			strictPort: true,
			ws: {
				protocol: 'ws',
				host: '0.0.0.0',
				port: 1421,
			},
			watch: {
				ignored: ['**/src-tauri/**'],
			},
		},
	},
	ui: {
		fonts: false,
	},
	devtools: {
		enabled: true,
	},
	compatibilityDate: '2026-07-30',
	// future: {
	// 	compatibilityVersion: 5,
	// },
})
