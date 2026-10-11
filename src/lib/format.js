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
