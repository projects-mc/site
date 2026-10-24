import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkout, fileList } from '#lib/git.ts';
import { stubFetch, call, reply as answer, type FetchMock } from '../test-fetch.ts';

const reply = (body: unknown) => answer(200, body);


let fetchMock: FetchMock;
beforeEach(() => {
	fetchMock = stubFetch();
});

describe('git', () => {
	it('updates straight away without local changes', async () => {
		fetchMock.mockResolvedValue(reply({ head: { hash: 'abc' }, commits: [] }));
		expect(await checkout('game', null)).toEqual({ head: { hash: 'abc' }, commits: [] });
		expect(call(fetchMock, 0).url).toMatch(/\/api\/instances\/game\/git\/checkout$/);
		expect(JSON.parse(call(fetchMock, 0).body ?? '')).toEqual({ commit: null, force: false });
	});

	it('asks before overwriting local changes', async () => {
		fetchMock.mockResolvedValueOnce(reply({ dirty: ['a.sk'] }));
		vi.stubGlobal('confirm', vi.fn(() => false));
		expect(await checkout('game', 'abc1234')).toBeNull();
		expect(fetchMock).toHaveBeenCalledTimes(1);

		vi.stubGlobal('confirm', vi.fn(() => true));
		fetchMock.mockResolvedValueOnce(reply({ dirty: ['a.sk'] })).mockResolvedValueOnce(reply({ head: {}, commits: [] }));
		expect(await checkout('game', 'abc1234')).toEqual({ head: {}, commits: [] });
		expect(JSON.parse(call(fetchMock, 2).body ?? '')).toEqual({ commit: 'abc1234', force: true });
	});

	it('shortens long file lists', () => {
		expect(fileList(['a', 'b'])).toBe('a\nb');
		expect(fileList(['a', 'b', 'c'], 2)).toBe('a\nb\n...and 1 more');
	});
});
