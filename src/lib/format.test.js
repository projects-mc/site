import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatBytes, ago, isoFromUnix, formatRange, formatDay } from '#lib/format';
import { parseLog } from '#lib/console';

afterEach(() => vi.useRealTimers());

describe('format', () => {
	it('formats sizes', () => {
		expect(formatBytes(0)).toBe('0 B');
		expect(formatBytes(1023)).toBe('1023 B');
		expect(formatBytes(1536)).toBe('1.5 KB');
		expect(formatBytes(30 * 1024 * 1024)).toBe('30.0 MB');
		expect(formatBytes(5 * 1024 ** 4)).toBe('5120.0 GB');
	});

	it('says how long ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
		const now = Date.now() / 1000;
		expect(ago(now - 10)).toBe('just now');
		expect(ago(now - 120)).toBe('2 min ago');
		expect(ago(now - 3 * 3600)).toBe('3 hr ago');
		expect(ago(now - 86400)).toBe('1 day ago');
		expect(ago(now - 5 * 86400)).toBe('5 days ago');
		// Clock skew between aspen and the browser: a time slightly ahead is still "just now"
		expect(ago(now + 30)).toBe('just now');
	});

	it('converts unix seconds and formats ranges in UTC', () => {
		expect(isoFromUnix(0)).toBe('1970-01-01T00:00:00.000Z');
		const start = isoFromUnix(1_760_000_000);
		expect(formatDay(start, false)).toBe('Oct 9');
		expect(formatRange(start, null, false)).toBe('Oct 9 - now');
		expect(formatRange(start, isoFromUnix(1_760_200_000), false)).toBe('Oct 9 - Oct 11');
	});
});

describe('parseLog', () => {
	it('splits madrone and Paper lines into parts', () => {
		expect(parseLog('[23:24:23 INFO] [Skript] loaded 3 scripts\n[01:02:03 WARN]: plain message')).toEqual([
			{ time: '23:24:23', level: 'INFO', source: 'Skript', message: 'loaded 3 scripts' },
			{ time: '01:02:03', level: 'WARN', source: undefined, message: 'plain message' }
		]);
	});

	it("keeps aspen's lines and stack traces as text", () => {
		expect(parseLog('[aspen] Ready\n\tat a.b.C(C.java:1)\n')).toEqual([
			{ message: '[aspen] Ready' },
			{ message: '\tat a.b.C(C.java:1)' }
		]);
	});
});
