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

export function formatAbsoluteTimeLong(
	value: string | number | Date,
	locale: string,
	timeZone?: string,
): string {
	const time = new Date(value)
	if (Number.isNaN(time.getTime())) return ''
	return new Intl.DateTimeFormat(resolveLocale(locale), {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZoneName: 'short',
		timeZone,
	}).format(time)
}

export type TimeFormat = 'relative' | 'absolute'

export function formatTime(
	value: string | number | Date,
	format: TimeFormat,
	locale: string,
	timeZone?: string,
): string {
	if (format === 'relative') return formatRelativeTime(value, locale, timeZone)
	return formatAbsoluteTime(value, locale, timeZone)
}

export function resolveTimeZone(timeZone: string | undefined): string | undefined {
	return timeZone && timeZone !== 'system' ? timeZone : undefined
}
