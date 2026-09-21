import { uiTheme, iconsTheme } from './theme'

export default defineAppConfig({
	app: {
		name: 'Riki',
	},
	routes: {
		auth: {
			signIn: '/auth/sign-in',
			signUp: '/auth/sign-up',
		},
		settings: {
			preferences: '/settings/preferences',
		},
	},
	ui: {
		colors: {
			primary: 'blue',
			neutral: 'neutral',
		},
		icons: iconsTheme,
		...uiTheme,
	},
})
