import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, token, ApiError } from '#lib/api';

const reply = (status, body) =>
	new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});

let fetchMock;
beforeEach(() => {
	fetchMock = vi.fn();
	vi.stubGlobal('fetch', fetchMock);
});

describe('api', () => {
	it('sends the session token and parses JSON', async () => {
		localStorage.setItem('session', 'abc');
		fetchMock.mockResolvedValue(reply(200, [{ name: 'game' }]));
		expect(await api.instances()).toEqual([{ name: 'game' }]);
		const [url, options] = fetchMock.mock.calls[0];
		expect(url).toMatch(/\/api\/instances$/);
		expect(options.headers.Authorization).toBe('Bearer abc');
	});

	it('returns null for 204 No Content', async () => {
		fetchMock.mockResolvedValue(reply(204));
		expect(await api.stop('game')).toBeNull();
	});

	it("turns aspen's errors into ApiErrors with its message", async () => {
		fetchMock.mockResolvedValue(reply(409, { error: 'stop the instance first' }));
		const error = await api.remove('game').catch((e) => e);
		expect(error).toBeInstanceOf(ApiError);
		expect(error.status).toBe(409);
		expect(error.message).toBe('stop the instance first');
	});

	it('copes with error bodies that are not JSON', async () => {
		fetchMock.mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
		const error = await api.me().catch((e) => e);
		expect(error.message).toBe('Request failed (502)');
	});

	it('forgets the token when aspen says it is no longer valid', async () => {
		localStorage.setItem('session', 'old');
		fetchMock.mockResolvedValue(reply(401, { error: 'please log in again' }));
		await api.me().catch(() => {});
		expect(token()).toBeNull();
	});

	it('logs in and out', async () => {
		fetchMock.mockResolvedValueOnce(reply(200, { token: 'new' }));
		await api.login('code');
		expect(token()).toBe('new');
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: 'code' });
		// Logging out clears the token even if aspen can't be reached
		fetchMock.mockRejectedValueOnce(new TypeError('offline'));
		await api.logout();
		expect(token()).toBeNull();
	});

	it('escapes instance names and paths', async () => {
		fetchMock.mockResolvedValue(reply(200, []));
		await api.files('my game', 'Skript/a b&c.sk');
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/instances\/my%20game\/files\?path=Skript%2Fa%20b%26c\.sk$/);
	});

	it('sends file contents as they are', async () => {
		fetchMock.mockResolvedValue(reply(204));
		await api.writeFile('game', 'a.sk', 'on load:\n\tsend "hi"');
		const options = fetchMock.mock.calls[0][1];
		expect(options.method).toBe('PUT');
		expect(options.body).toBe('on load:\n\tsend "hi"');
		expect(options.headers['Content-Type']).toBeUndefined();
	});

	it('puts the token in links and WebSocket addresses', () => {
		localStorage.setItem('session', 'tok');
		expect(api.downloadLink('game')).toMatch(/\/instances\/game\/download\?token=tok$/);
		expect(api.fileLink('game', 'a.sk')).toMatch(/file\?path=a\.sk&token=tok$/);
		expect(api.events().url).toMatch(/^wss?:\/\/.*\/api\/events\?token=tok$/);
		expect(api.console('game').url).toMatch(/^wss?:\/\/.*\/instances\/game\/console\?token=tok$/);
	});
});
