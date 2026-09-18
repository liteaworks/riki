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
			general: '/settings/general',
		},
	},
	ui: {
		colors: {
			primary: 'blue',
			neutral: 'neutral',
		},
		button: {
			slots: {
				base: 'cursor-pointer',
			},
		},
		formField: {
			slots: {
				root: 'w-full',
			},
		},
		select: {
			slots: {
				content: 'min-w-fit',
				trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
			},
		},
		selectMenu: {
			slots: {
				content: 'min-w-fit',
				trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
			},
		},
		input: {
			slots: {
				root: 'w-full',
			},
		},
		inputMenu: {
			slots: {
				root: 'w-full',
				content: 'min-w-fit',
			},
		},
		textarea: {
			slots: {
				root: 'w-full',
				base: 'resize-none',
			},
		},
		accordion: {
			slots: {
				trigger: 'cursor-pointer',
				item: 'md:py-2',
			},
		},
		navigationMenu: {
			slots: {
				link: 'cursor-pointer',
			},
		},
		tabs: {
			compoundVariants: [
				{
					color: 'neutral',
					variant: 'pill',
					class: {
						indicator: 'bg-default',
						trigger: [
							'data-[state=active]:text-default outline-default/25 focus-visible:outline-3',
							'in-[[data-slot=list]:not(:has([data-slot=indicator]))]:data-[state=active]:before:bg-default',
						],
					},
				},
			],
		},
		sidebar: {
			slots: {
				root: '[--sidebar-width-icon:3rem]',
				body: 'p-2 gap-2',
				header: 'px-2',
				title: 'text-sm font-normal',
			},
		},
		calendar: {
			variants: {
				color: {
					primary: {
						headCell: 'text-muted',
						cellTrigger: 'outline-primary/25',
					},
				},
			},
		},
		icons: {
			arrowDown: 'ph:arrow-down',
			arrowLeft: 'ph:arrow-left',
			arrowRight: 'ph:arrow-right',
			arrowUp: 'ph:arrow-up',
			caution: 'ph:warning-circle',
			check: 'ph:check',
			chevronDoubleLeft: 'ph:caret-double-left',
			chevronDoubleRight: 'ph:caret-double-right',
			chevronDown: 'ph:caret-down',
			chevronLeft: 'ph:caret-left',
			chevronRight: 'ph:caret-right',
			chevronUp: 'ph:caret-up',
			close: 'ph:x',
			copy: 'ph:copy',
			copyCheck: 'ph:check-circle',
			dark: 'ph:moon',
			drag: 'ph:dots-six-vertical',
			ellipsis: 'ph:dots-three',
			error: 'ph:x-circle',
			external: 'ph:arrow-up-right',
			eye: 'ph:eye',
			eyeOff: 'ph:eye-slash',
			file: 'ph:file',
			folder: 'ph:folder',
			folderOpen: 'ph:folder-open',
			hash: 'ph:hash',
			info: 'ph:info',
			light: 'ph:sun',
			loading: 'ph:circle-notch',
			menu: 'ph:list',
			minus: 'ph:minus',
			panelClose: 'ph:caret-left',
			panelOpen: 'ph:caret-right',
			plus: 'ph:plus',
			reload: 'ph:arrow-counter-clockwise',
			search: 'ph:magnifying-glass',
			stop: 'ph:square',
			star: 'ph:star',
			success: 'ph:check-circle',
			system: 'ph:monitor',
			tip: 'ph:lightbulb',
			upload: 'ph:upload',
			warning: 'ph:warning',
			// app extend
			square: 'ph:square',
			reset: 'ph:arrow-counter-clockwise',
			refresh: 'ph:arrows-clockwise',
			rows: 'ph:rows',
			grid: 'ph:grid-nine',
			text: 'ph:text-t',
			starFill: 'ph:star-fill',
			settings: 'ph:gear-fine',
			user: 'ph:user-circle',
			signIn: 'ph:sign-in',
			signOut: 'ph:sign-out',
			globe: 'ph:globe-simple',
			general: 'ph:palette',
			colorMode: 'ph:circle-half',
			// logos
			googleLogo: 'ph:google-logo-bold',
			githubLogo: 'ph:github-logo-bold',
		},
	},
})
