interface InlineToken {
	attrs?: [string, string][] | null
}

interface InlineState {
	src: string
	pos: number
	posMax: number
	push: (type: string, tag: string, nesting: number) => InlineToken
}

interface MarkdownItLike {
	inline: {
		ruler: {
			before: (
				beforeName: string,
				ruleName: string,
				rule: (state: InlineState, silent: boolean) => boolean,
			) => void
		}
	}
}

function readQuotedValue(src: string, index: number): { value: string; nextIndex: number } | null {
	if (src[index] !== '"') return null
	const end = src.indexOf('"', index + 1)
	if (end === -1) return null
	return { value: src.slice(index + 1, end), nextIndex: end + 1 }
}

function isKeyChar(code: number): boolean {
	return (code >= 65 && code <= 90) || (code >= 97 && code <= 122)
}

function mentionRule(state: InlineState, silent: boolean): boolean {
	const start = state.pos
	if (state.src[start] !== '[' || state.src[start + 1] !== '@') return false
	let index = start + 2
	const skipSpaces = () => {
		while (index < state.src.length && state.src[index] === ' ') index++
	}
	const attrs: [string, string][] = []
	skipSpaces()
	while (index < state.src.length && state.src[index] !== ']') {
		let keyEnd = index
		while (keyEnd < state.src.length && isKeyChar(state.src.charCodeAt(keyEnd))) keyEnd++
		const key = state.src.slice(index, keyEnd)
		index = keyEnd
		if (!key || state.src[index] !== '=') return false
		const quoted = readQuotedValue(state.src, index + 1)
		if (!quoted) return false
		if (key === 'label' || key === 'char') attrs.push([key, quoted.value])
		index = quoted.nextIndex
		skipSpaces()
	}
	if (state.src[index] !== ']') return false
	if (!attrs.some(([key, value]) => key === 'label' && value)) return false
	state.pos = index + 1
	if (silent) return true
	const token = state.push('mdc_inline_component', 'mention', 0)
	token.attrs = attrs
	return true
}

export function mentionPlugin(): {
	name: string
	markdownItPlugins: Array<(md: MarkdownItLike) => void>
} {
	return {
		name: 'mention',
		markdownItPlugins: [
			(md) => {
				md.inline.ruler.before('comark_inline_span', 'mention', mentionRule)
			},
		],
	}
}
