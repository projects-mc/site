// Dates and times in the visitor's own timezone; `local` false formats in UTC so prerendered HTML is stable
export const formatDay = (iso, local = true) =>
	new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(local ? {} : { timeZone: 'UTC' }) });

export const formatTime = (iso) =>
	new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });

// "May 3 - May 4", or "May 4 - now" for an entry still being written
export const formatRange = (start, end, local = true) =>
	`${formatDay(start, local)} - ${end ? formatDay(end, local) : 'now'}`;

// Full date and time, in the visitor's own locale and timezone
export const formatDateTime = (iso) =>
	new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

// Unix seconds -> ISO, for the date helpers above
export const isoFromUnix = (seconds) => new Date(seconds * 1000).toISOString();

// "3 min ago", "2 days ago"
export function ago(seconds) {
	const elapsed = Date.now() / 1000 - seconds;
	const units = [['day', 86400], ['hr', 3600], ['min', 60]];
	for (const [unit, size] of units) {
		const count = Math.floor(elapsed / size);
		if (count >= 1) return `${count} ${unit}${unit === 'day' && count > 1 ? 's' : ''} ago`;
	}
	return 'just now';
}

// 1536 -> "1.5 KB"
export function formatBytes(bytes) {
	const units = ['B', 'KB', 'MB', 'GB'];
	let unit = 0;
	while (bytes >= 1024 && unit < units.length - 1) {
		bytes /= 1024;
		unit++;
	}
	return `${unit === 0 ? bytes : bytes.toFixed(1)} ${units[unit]}`;
}
