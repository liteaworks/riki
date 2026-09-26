import type { TVConfig } from '@nuxt/ui'
import type * as ui from '#build/ui'

export const mentionChipClass =
	'mention mx-0.5 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 align-baseline text-xs font-medium whitespace-nowrap text-primary'

const selectSlots = {
	slots: {
		content: 'min-w-fit',
		trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
	},
}

export const uiTheme = {
	formField: {
		slots: {
			root: 'w-full',
		},
	},
	select: selectSlots,
	selectMenu: selectSlots,
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
			body: [
				'p-2 pr-0 gap-2',
				'group-data-[state=collapsed]/sidebar:overflow-x-hidden',
				'scrollbar-gutter-stable scrollbar-thumb-transparent hover:scrollbar-thumb-[var(--ui-border)]',
			],
			header: 'px-2',
			title: 'text-sm font-normal',
		},
	},
	navigationMenu: {
		slots: {
			separator: 'px-0 hidden',
		},
	},
	modal: {
		slots: {
			overlay: 'backdrop-blur-xs',
			footer: 'bg-muted dark:bg-muted/20',
		},
		variants: {
			overlay: {
				true: {
					overlay: 'bg-black/10 dark:bg-black/20',
				},
			},
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
	editor: {
		slots: {
			base: [
				'*:my-2 sm:px-0.5 [&_p]:leading-6',
				'[&_h1]:text-xl [&_h2]:text-lg [&_h3]:text-base [&_h4]:text-base [&_h5]:text-base [&_h6]:text-base',
				'[&_h2>code]:text-lg/6 [&_h3>code]:text-base/5',
				'[&_blockquote]:border-s-2 [&_blockquote]:ps-4',
				'[&_pre]:px-2 [&_pre]:py-2',
				'[&_:is(ul,ol)]:ps-4 **:data-[type=horizontalRule]:my-4',
			],
		},
	},
	prose: {
		p: { base: 'my-2 text-sm/6' },
		li: { base: 'my-0.5 text-sm/6' },
		ul: { base: 'my-2' },
		ol: { base: 'my-2' },
		h1: { slots: { base: 'text-xl mb-4' } },
		h2: { slots: { base: 'text-lg mt-6 mb-3' } },
		h3: { slots: { base: 'text-base mt-4 mb-2' } },
		h4: { slots: { base: 'text-sm mt-3 mb-1.5' } },
		code: { base: 'text-xs' },
		pre: { slots: { root: 'my-2', base: 'text-xs/5' } },
		table: { slots: { root: 'my-2' } },
		hr: { base: 'my-4' },
	},
} satisfies TVConfig<typeof ui>
