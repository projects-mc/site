import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeSocket } from '../test-setup.js';
import {
	session,
	currentInstance,
	restore,
	refresh,
	select,
	act,
	connectEvents,
	disconnectEvents,
	onBackupsChanged,
	onDatabasesChanged,
	onDatabaseBackupsChanged,
	readStored
} from '#lib/session.svelte.js';
import { ApiError } from '#lib/api';

const game = (name, phase = 'stopped') => ({ name, phase, players: 0 });
const json = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

let fetchMock;
beforeEach(() => {
	disconnectEvents();
	Object.assign(session, { user: null, instances: [], selected: '', loaded: false, live: false });
	fetchMock = vi.fn(async (url) => {
		if (url.endsWith('/me')) return json({ id: 'u', name: 'Alice', admin: false });
		if (url.endsWith('/instances')) return json([game('one'), game('two')]);
		return new Response(null, { status: 204 });
	});
	vi.stubGlobal('fetch', fetchMock);
});

describe('session', () => {
	it('logged out, it is loaded and empty without asking aspen', async () => {
		restore();
		await refresh();
		expect(session).toMatchObject({ user: null, instances: [], loaded: true });
		expect(fetchMock).not.toHaveBeenCalled();
		expect(FakeSocket.opened).toHaveLength(0);
	});

	it('refresh loads the user and instances, picks one and caches them', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		expect(session.user.name).toBe('Alice');
		expect(session.instances.map((i) => i.name)).toEqual(['one', 'two']);
		expect(currentInstance().name).toBe('one');
		expect(readStored('sessionCache', null).instances).toHaveLength(2);
	});

	it('restores the cached session straight away', () => {
		localStorage.setItem('session', 't');
		localStorage.setItem('sessionCache', JSON.stringify({ user: { name: 'Alice' }, instances: [game('two')] }));
		localStorage.setItem('instance', 'two');
		restore();
		expect(session.loaded).toBe(true);
		expect(currentInstance().name).toBe('two');
	});

	it('ignores a corrupt cache instead of breaking the page', () => {
		localStorage.setItem('session', 't');
		for (const bad of ['{not json', '"text"', '{"user":null}', '{"user":{},"instances":"x"}']) {
			localStorage.setItem('sessionCache', bad);
			expect(() => restore()).not.toThrow();
			expect(session.loaded).toBe(false);
		}
	});

	it('a rejected token logs out', async () => {
		localStorage.setItem('session', 't');
		session.user = { name: 'Alice' };
		fetchMock.mockResolvedValue(new Response('{"error":"please log in again"}', { status: 401 }));
		await refresh();
		expect(session.user).toBeNull();
		expect(localStorage.getItem('session')).toBeNull();
	});

	it('a network failure keeps what is on screen', async () => {
		localStorage.setItem('session', 't');
		session.user = { name: 'Alice' };
		session.instances = [game('one')];
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
		await refresh();
		expect(session.user.name).toBe('Alice');
		expect(session.instances).toHaveLength(1);
		expect(session.loaded).toBe(true);
	});

	it('remembers the selected instance', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		select('two');
		expect(currentInstance().name).toBe('two');
		expect(localStorage.getItem('instance')).toBe('two');
	});
});

describe('live updates', () => {
	it('refresh connects once, and pushed lists replace the instances', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		await refresh();
		expect(FakeSocket.opened).toHaveLength(1);
		const socket = FakeSocket.opened[0];
		expect(socket.url).toMatch(/\/api\/events\?token=t$/);
		socket.receive({ type: 'instances', instances: [game('one', 'running')] });
		expect(session.live).toBe(true);
		expect(session.instances).toEqual([game('one', 'running')]);
	});

	it('ignores junk messages', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		const socket = FakeSocket.opened[0];
		for (const junk of ['not json', 'null', '{}', '{"type":"instances"}', '{"type":"instances","instances":5}']) {
			expect(() => socket.receive(junk)).not.toThrow();
		}
		expect(session.instances.map((i) => i.name)).toEqual(['one', 'two']);
	});

	it('a dropped connection falls back to polling, which reconnects', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		FakeSocket.opened[0].receive({ type: 'instances', instances: [] });
		FakeSocket.opened[0].close();
		expect(session.live).toBe(false);
		await refresh();
		expect(FakeSocket.opened).toHaveLength(2);
	});

	it('tells pages about backup changes until they unsubscribe', async () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen = [];
		const stop = onBackupsChanged((name) => seen.push(name));
		FakeSocket.opened[0].receive({ type: 'backups', instance: 'one' });
		stop();
		FakeSocket.opened[0].receive({ type: 'backups', instance: 'two' });
		expect(seen).toEqual(['one']);
	});
	it('tells pages about database changes, and to read everything again after reconnecting', async () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen = [];
		const stop = onDatabasesChanged((name) => seen.push(name));
		// Connecting counts as "anything may have changed"
		FakeSocket.opened[0].receive({ type: 'instances', instances: [] });
		FakeSocket.opened[0].receive({ type: 'database', name: 'stats' });
		FakeSocket.opened[0].receive({ type: 'databases' });
		// Only the first list after connecting does
		FakeSocket.opened[0].receive({ type: 'instances', instances: [] });
		stop();
		FakeSocket.opened[0].receive({ type: 'database', name: 'other' });
		expect(seen).toEqual([null, 'stats', null]);
	});


	it('tells pages about database backups, and to read them again after reconnecting', async () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen = [];
		const stop = onDatabaseBackupsChanged((name) => seen.push(name));
		FakeSocket.opened[0].receive({ type: 'instances', instances: [] });
		FakeSocket.opened[0].receive({ type: 'databaseBackups', name: 'stats' });
		FakeSocket.opened[0].receive({ type: 'database', name: 'stats' });
		stop();
		FakeSocket.opened[0].receive({ type: 'databaseBackups', name: 'other' });
		expect(seen).toEqual([null, 'stats']);
	});

	it('does not connect without a token', () => {
		connectEvents();
		expect(FakeSocket.opened).toHaveLength(0);
	});
});

describe('act', () => {
	it('shows errors from aspen and refreshes afterwards', async () => {
		localStorage.setItem('session', 't');
		const alert = vi.fn();
		vi.stubGlobal('alert', alert);
		await act(() => Promise.reject(new ApiError(409, 'that name is taken')));
		expect(alert).toHaveBeenCalledWith('that name is taken');
		expect(fetchMock.mock.calls.some(([url]) => url.endsWith('/instances'))).toBe(true);
	});

	it('long actions stay quiet about dropped connections', async () => {
		localStorage.setItem('session', 't');
		const alert = vi.fn();
		vi.stubGlobal('alert', alert);
		await act(() => Promise.reject(new TypeError('network')), true);
		expect(alert).not.toHaveBeenCalled();
		await act(() => Promise.reject(new ApiError(409, 'too many instances are running')), true);
		expect(alert).toHaveBeenCalledWith('too many instances are running');
	});

	it('returns the action result', async () => {
		localStorage.setItem('session', 't');
		expect(await act(async () => 42)).toBe(42);
	});
});
