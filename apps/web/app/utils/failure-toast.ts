type Toast = ReturnType<typeof useToast>

// `instanceof Error` drops the message for the many throwables that are not real
// Errors (better-auth results, plain objects, strings), so probe structurally.
export function messageOf(error: unknown): string | undefined {
	if (typeof error === 'string') return error
	if (error && typeof error === 'object' && 'message' in error) {
		const { message } = error as { message?: unknown }
		if (typeof message === 'string') return message
	}
	return undefined
}

export function reportFailure(toast: Toast, title: string, error: unknown) {
	toast.add({ title, description: messageOf(error), color: 'error' })
}
