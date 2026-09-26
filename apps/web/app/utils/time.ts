// Note timestamps are typed `Date` by the drizzle rows but arrive as ISO strings
// over JSON; normalise rather than trust either.
export function toEpoch(value: string | number | Date): number {
	return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
	['second', 60],
	['minute', 60],
	['hour', 24],
	['day', 7],
	['week', 4.34524],
	['month', 12],
]

export function formatRelativeTime(value: string | number | Date, locale: string): string {
	const time = toEpoch(value)
	if (Number.isNaN(time)) return ''
	const formatter = new Intl.RelativeTimeFormat(resolveLocale(locale), { numeric: 'auto' })
	let delta = Math.round((time - Date.now()) / 1000)
	for (const [unit, limit] of UNITS) {
		if (Math.abs(delta) < limit) return formatter.format(delta, unit)
		delta = Math.round(delta / limit)
	}
	return formatter.format(delta, 'year')
}

export function formatAbsoluteTime(value: string | number | Date, locale: string): string {
	const time = new Date(value)
	if (Number.isNaN(time.getTime())) return ''
	return new Intl.DateTimeFormat(resolveLocale(locale), {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(time)
}
