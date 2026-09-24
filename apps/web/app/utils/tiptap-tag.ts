import Mention from '@tiptap/extension-mention'
import { mentionChipClass } from '~/theme/ui'

const tagPattern = /^:tag\{label="((?:[^"\\]|\\.)*)"\}/
const startPattern = /(?<!:):tag\{label="/

function unescape(value: string): string {
	return value.replace(/\\(.)/g, '$1')
}

function escape(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function startOfTag(src: string): number {
	return src.search(startPattern)
}

function tokenizeTag(src: string) {
	const matched = tagPattern.exec(src)
	if (!matched) return undefined
	const label = unescape(matched[1] ?? '')

	return { type: 'mention', raw: matched[0], content: '', attributes: { label } }
}

interface TagRenderContext {
	previousNode?: unknown
}

function needsSpace(context?: TagRenderContext): boolean {
	const prev = context?.previousNode
	if (!prev || typeof prev !== 'object') return false
	if ((prev as { type?: unknown }).type !== 'text') return true

	const text = (prev as { text?: unknown }).text
	const last = typeof text === 'string' ? text.slice(-1) : ''

	return !!last && !' \t\n*_['.includes(last)
}

function renderTag(node: { attrs?: Record<string, unknown> }, ...rest: unknown[]): string {
	const label = node.attrs?.label
	const prefix = needsSpace(rest[1] as TagRenderContext | undefined) ? ' ' : ''

	return `${prefix}:tag{label="${escape(typeof label === 'string' ? label : '')}"}`
}

export const tagMention = Mention.extend({
	markdownTokenizer: { name: 'mention', level: 'inline', start: startOfTag, tokenize: tokenizeTag },
	parseMarkdown: (token: any, h: any) => h.createNode('mention', { mentionSuggestionChar: '#', ...token.attributes }),
	renderMarkdown: renderTag,
}).configure({
	HTMLAttributes: { class: mentionChipClass },
	renderText: ({ node }) => `#${node.attrs.label ?? ''}`,
	renderHTML: ({ options, node }) => {
		const text = `#${node.attrs.label ?? ''}`
		return ['span', { 'data-type': 'mention', ...options.HTMLAttributes }, text]
	},
})
