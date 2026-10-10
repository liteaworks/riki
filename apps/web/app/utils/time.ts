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

export function formatRelativeTime(
	value: string | number | Date,
	locale: string,
	_timeZone?: string,
): string {
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

export function formatAbsoluteTime(
	value: string | number | Date,
	locale: string,
	timeZone?: string,
): string {
	const time = new Date(value)
	if (Number.isNaN(time.getTime())) return ''
	return new Intl.DateTimeFormat(resolveLocale(locale), {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone,
	}).format(time)
}

function calendarDay(value: Date, timeZone: string | undefined): number {
	const parts = new Intl.DateTimeFormat('en-CA', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		timeZone,
	}).formatToParts(value)
	const get = (type: 'year' | 'month' | 'day') =>
		Number(parts.find((part) => part.type === type)?.value)
	return Date.UTC(get('year'), get('month') - 1, get('day'))
}

// The list line has one row to spend: drop whatever the viewer can infer.
export function formatCompactTime(
	value: string | number | Date,
	locale: string,
	timeZone?: string,
): string {
	const time = new Date(value)
	if (Number.isNaN(time.getTime())) return ''
	const day = calendarDay(time, timeZone)
	const today = calendarDay(new Date(), timeZone)
	const yearStart = Date.UTC(new Date(today).getUTCFullYear(), 0, 1)
	const dayDelta = Math.round((day - today) / 86400000)
	const options: Intl.DateTimeFormatOptions =
		dayDelta === 0
			? { timeZone, timeStyle: 'short' }
			: dayDelta >= -6
				? { timeZone, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }
				: day >= yearStart
					? { timeZone, month: 'short', day: 'numeric' }
					: { timeZone, dateStyle: 'medium' }
	return new Intl.DateTimeFormat(resolveLocale(locale), options).format(time)
}

export type TimeFormat = 'relative' | 'absolute'

export function formatTime(
	value: string | number | Date,
	format: TimeFormat,
	locale: string,
	timeZone?: string,
): string {
	if (format === 'relative') return formatRelativeTime(value, locale, timeZone)
	return formatCompactTime(value, locale, timeZone)
}

export function resolveTimeZone(timeZone: string | undefined): string | undefined {
	return timeZone && timeZone !== 'system' ? timeZone : undefined
}
