export function extractTagNames(editor: any): string[] {
	const collected = new Map<string, string>()
	editor?.state.doc.descendants((node: any) => {
		if (node.type.name !== 'mention') return true
		const label = typeof node.attrs?.label === 'string' ? node.attrs.label.replace(/^#/, '') : ''
		if (label && !collected.has(label.toLowerCase())) collected.set(label.toLowerCase(), label)
		return true
	})
	return [...collected.values()]
}
