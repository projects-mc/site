import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkout, fileList } from '#lib/git';

const reply = (body) =>
	new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

let fetchMock;
beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

describe('git', () => {
	it('updates straight away without local changes', async () => {
		fetchMock.mockResolvedValue(reply({ head: { hash: 'abc' } }));
		expect(await checkout('game', null)).toEqual({ head: { hash: 'abc' } });
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/instances\/game\/git\/checkout$/);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ commit: null, force: false });
	});

	it('asks before overwriting local changes', async () => {
		fetchMock.mockResolvedValueOnce(reply({ dirty: ['a.sk'] }));
		vi.stubGlobal('confirm', vi.fn(() => false));
		expect(await checkout('game', 'abc1234')).toBeNull();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.stubGlobal('confirm', vi.fn(() => true));
		fetchMock.mockResolvedValueOnce(reply({ dirty: ['a.sk'] })).mockResolvedValueOnce(reply({ head: {} }));
		expect(await checkout('game', 'abc1234')).toEqual({ head: {} });
		expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ commit: 'abc1234', force: true });
	});

	it('shortens long file lists', () => {
		expect(fileList(['a', 'b'])).toBe('a\nb');
		expect(fileList(['a', 'b', 'c'], 2)).toBe('a\nb\n...and 1 more');
	});
});
