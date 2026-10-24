import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FakeSocket } from '../test-setup.ts';
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
} from '#lib/session.svelte.ts';
import { ApiError } from '#lib/api.ts';
import type { Instance, Phase, User } from '#lib/types.ts';
import { stubFetch, type FetchMock } from '../test-fetch.ts';
import { at } from '../test-util.ts';

const game = (name: string, phase: Phase = 'stopped'): Instance => ({
	name,
	phase,
	players: 0,
	owner: null,
	members: [],
	running: phase === 'running',
	memory: 0,
	memoryMax: 0,
	disk: 0,
	diskMax: 0,
	lobby: false,
	motd: '',
	git: false,
	gitUpdate: false
});
const alice: User = { id: 'u', name: 'Alice', admin: false };
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const socket = () => at(FakeSocket.opened);

let fetchMock: FetchMock;
beforeEach(() => {
	disconnectEvents();
	Object.assign(session, { user: null, instances: [], selected: '', loaded: false, live: false });
	fetchMock = stubFetch();
	fetchMock.mockImplementation((url) => {
		if (url.endsWith('/me')) return Promise.resolve(json(alice));
		if (url.endsWith('/instances')) return Promise.resolve(json([game('one'), game('two')]));
		return Promise.resolve(new Response(null, { status: 204 }));
	});
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
		expect(session.user?.name).toBe('Alice');
		expect(session.instances.map((i) => i.name)).toEqual(['one', 'two']);
		expect(currentInstance()?.name).toBe('one');
		expect((readStored('sessionCache') as { instances: unknown[] }).instances).toHaveLength(2);
	});

	it('restores the cached session straight away', () => {
		localStorage.setItem('session', 't');
		localStorage.setItem('sessionCache', JSON.stringify({ user: alice, instances: [game('two')] }));
		localStorage.setItem('instance', 'two');
		restore();
		expect(session.loaded).toBe(true);
		expect(currentInstance()?.name).toBe('two');
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
		session.user = alice;
		fetchMock.mockResolvedValue(new Response('{"error":"please log in again"}', { status: 401 }));
		await refresh();
		expect(session.user).toBeNull();
		expect(localStorage.getItem('session')).toBeNull();
	});

	it('a network failure keeps what is on screen', async () => {
		localStorage.setItem('session', 't');
		session.user = alice;
		session.instances = [game('one')];
		fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
		await refresh();
		expect(session.user).toMatchObject({ name: 'Alice' });
		expect(session.instances).toHaveLength(1);
		expect(session.loaded).toBe(true);
	});

	it('remembers the selected instance', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		select('two');
		expect(currentInstance()?.name).toBe('two');
		expect(localStorage.getItem('instance')).toBe('two');
	});
});

describe('live updates', () => {
	it('refresh connects once, and pushed lists replace the instances', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		await refresh();
		expect(FakeSocket.opened).toHaveLength(1);
		const events = socket();
		expect(events.url).toMatch(/\/api\/events\?token=t$/);
		events.receive({ type: 'instances', instances: [game('one', 'running')] });
		expect(session.live).toBe(true);
		expect(session.instances).toEqual([game('one', 'running')]);
	});

	it('ignores junk messages', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		const events = socket();
		for (const junk of ['not json', 'null', '{}', '{"type":"instances"}', '{"type":"instances","instances":5}']) {
			expect(() => events.receive(junk)).not.toThrow();
		}
		expect(session.instances.map((i) => i.name)).toEqual(['one', 'two']);
	});

	it('a dropped connection falls back to polling, which reconnects', async () => {
		localStorage.setItem('session', 't');
		await refresh();
		socket().receive({ type: 'instances', instances: [] });
		socket().close();
		expect(session.live).toBe(false);
		await refresh();
		expect(FakeSocket.opened).toHaveLength(2);
	});

	it('tells pages about backup changes until they unsubscribe', () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen: (string | null)[] = [];
		const stop = onBackupsChanged((name) => seen.push(name));
		socket().receive({ type: 'backups', instance: 'one' });
		stop();
		socket().receive({ type: 'backups', instance: 'two' });
		expect(seen).toEqual(['one']);
	});
	it('tells pages about database changes, and to read everything again after reconnecting', () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen: (string | null)[] = [];
		const stop = onDatabasesChanged((name) => seen.push(name));
		// Connecting counts as "anything may have changed"
		socket().receive({ type: 'instances', instances: [] });
		socket().receive({ type: 'database', name: 'stats' });
		socket().receive({ type: 'databases' });
		// Only the first list after connecting does
		socket().receive({ type: 'instances', instances: [] });
		stop();
		socket().receive({ type: 'database', name: 'other' });
		expect(seen).toEqual([null, 'stats', null]);
	});


	it('tells pages about database backups, and to read them again after reconnecting', () => {
		localStorage.setItem('session', 't');
		connectEvents();
		const seen: (string | null)[] = [];
		const stop = onDatabaseBackupsChanged((name) => seen.push(name));
		socket().receive({ type: 'instances', instances: [] });
		socket().receive({ type: 'databaseBackups', name: 'stats' });
		socket().receive({ type: 'database', name: 'stats' });
		stop();
		socket().receive({ type: 'databaseBackups', name: 'other' });
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
		expect(await act(() => Promise.resolve(42))).toBe(42);
	});
});
