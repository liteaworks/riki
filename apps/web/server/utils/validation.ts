import { z } from 'zod'

type RequestEvent = Parameters<Parameters<typeof defineEventHandler>[0]>[0]

function validationError(error: z.ZodError): never {
	throw createError({
		statusCode: 400,
		statusMessage: 'Validation failed',
		data: z.flattenError(error),
	})
}

export async function readBodyZod<T extends z.ZodType>(
	event: RequestEvent,
	schema: T,
): Promise<z.output<T>> {
	return readValidatedBody(event, (data: unknown) => {
		const result = schema.safeParse(data)
		if (!result.success) validationError(result.error)
		return result.data
	})
}

export async function readQueryZod<T extends z.ZodType>(
	event: RequestEvent,
	schema: T,
): Promise<z.output<T>> {
	return getValidatedQuery(event, (data: unknown) => {
		const result = schema.safeParse(data)
		if (!result.success) validationError(result.error)
		return result.data
	})
}
