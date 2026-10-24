// Dates and times in the visitor's own timezone; `local` false formats in UTC so prerendered HTML is stable
export const formatDay = (iso: string, local = true) =>
	new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(local ? {} : { timeZone: 'UTC' }) });

export const formatTime = (iso: string) =>
	new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

// "May 3 - May 4", or "May 4 - now" for an entry still being written
export const formatRange = (start: string, end: string | null | undefined, local = true) =>
	`${formatDay(start, local)} - ${end ? formatDay(end, local) : 'now'}`;

// Full date and time, in the visitor's own locale and timezone
export const formatDateTime = (iso: string) =>
	new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Unix seconds -> ISO, for the date helpers above
export const isoFromUnix = (seconds: number) => new Date(seconds * 1000).toISOString();

const UNITS: [string, number][] = [['day', 86400], ['hr', 3600], ['min', 60]];

// "3 min ago", "2 days ago"
export function ago(seconds: number) {
	const elapsed = Date.now() / 1000 - seconds;
	for (const [unit, size] of UNITS) {
		const count = Math.floor(elapsed / size);
		if (count >= 1) return `${count} ${unit}${unit === 'day' && count > 1 ? 's' : ''} ago`;
	}
	return 'just now';
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

// 1536 -> "1.5 KB"
export function formatBytes(bytes: number) {
	let unit = 0;
	while (bytes >= 1024 && unit < BYTE_UNITS.length - 1) {
		bytes /= 1024;
		unit++;
	}
	return `${unit === 0 ? bytes : bytes.toFixed(1)} ${BYTE_UNITS[unit]}`;
}
