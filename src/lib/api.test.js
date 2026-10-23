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

	it('adds and removes members', async () => {
		fetchMock.mockResolvedValueOnce(reply(200, { name: 'game' })).mockResolvedValueOnce(reply(204));
		await api.addMember('game', 'Steve');
		await api.removeMember('game', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
		expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/instances\/game\/members$/);
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ player: 'Steve' });
		expect(fetchMock.mock.calls[1][0]).toMatch(/\/members\/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa$/);
		expect(fetchMock.mock.calls[1][1].method).toBe('DELETE');
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

	it('reaches databases by name, whatever the name', async () => {
		localStorage.setItem('session', 'abc');
		fetchMock.mockImplementation(async () => reply(204));
		await api.createDatabase('My Stats');
		await api.databaseKeys('My Stats', 'coins::', 'al ice');
		await api.databaseKeys('My Stats', '');
		await api.setDatabaseKey('My Stats', 'coins::bob', 'number', '5');
		await api.deleteDatabaseKey('My Stats', 'coins', true);
		await api.deleteDatabase('My Stats');
		const calls = fetchMock.mock.calls.map(([url, options]) => [options.method, url.replace(/^.*\/api/, '')]);
		expect(calls).toEqual([
			['POST', '/databases'],
			['GET', '/databases/My%20Stats/keys?prefix=coins%3A%3A&after=al%20ice'],
			['GET', '/databases/My%20Stats/keys?prefix='],
			['PUT', '/databases/My%20Stats/key'],
			['DELETE', '/databases/My%20Stats/key?key=coins&list=true'],
			['DELETE', '/databases/My%20Stats']
		]);
		expect(JSON.parse(fetchMock.mock.calls[3][1].body)).toEqual({ key: 'coins::bob', type: 'number', value: '5' });
		expect(api.databaseDownloadLink('a/b')).toMatch(/\/api\/databases\/a%2Fb\/download\?token=abc$/);
	});

	it("reaches a database's backups", async () => {
		localStorage.setItem('session', 'abc');
		fetchMock.mockImplementation(async () => reply(204));
		await api.backUpDatabase('My Stats');
		await api.restoreDatabase('My Stats', '1700000000000-auto');
		await api.databaseBackupKeys('My Stats', '1700000000000-auto', 'coins::');
		await api.databaseBackupKey('My Stats', '1700000000000-auto', 'a b');
		await api.deleteDatabaseBackup('My Stats', '1700000000000-auto');
		const calls = fetchMock.mock.calls.map(([url, options]) => [options.method, url.replace(/^.*\/api/, '')]);
		expect(calls).toEqual([
			['POST', '/databases/My%20Stats/backups'],
			['POST', '/databases/My%20Stats/backups/1700000000000-auto/restore'],
			['GET', '/databases/My%20Stats/backups/1700000000000-auto/keys?prefix=coins%3A%3A'],
			['GET', '/databases/My%20Stats/backups/1700000000000-auto/key?key=a%20b'],
			['DELETE', '/databases/My%20Stats/backups/1700000000000-auto']
		]);
		expect(api.databaseBackupLink('x', '1-manual')).toMatch(/\/api\/databases\/x\/backups\/1-manual\/download\?token=abc$/);
	});

	it("downloads and uploads a server's settings whole", async () => {
		localStorage.setItem('session', 'abc');
		fetchMock.mockImplementation(async () => reply(200, { name: 'my game' }));
		await api.putSettings('my game', 'motd = "<gold>Hi"\n');
		const [url, options] = fetchMock.mock.calls[0];
		expect([options.method, url.replace(/^.*\/api/, '')]).toEqual(['PUT', '/instances/my%20game/settings']);
		expect(options.body).toBe('motd = "<gold>Hi"\n');
		expect(api.settingsLink('my game')).toMatch(/\/api\/instances\/my%20game\/settings\?token=abc$/);
	});
});
