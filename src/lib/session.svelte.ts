import { api, token, ApiError } from '#lib/api.ts';
import { allows, type Permission } from '#lib/permissions.ts';
import type { EventMessage, Instance, User } from '#lib/types.ts';

interface Session {
	user: User | null;
	instances: Instance[];
	selected: string;
	loaded: boolean;
	live: boolean;
}

// The logged-in player and their instances, shared by every page. aspen pushes changes over a WebSocket (live: it's
// connected); while it isn't, the layout polls instead
export const session: Session = $state({ user: null, instances: [], selected: '', loaded: false, live: false });

export const currentInstance = (): Instance | undefined =>
	session.instances.find((instance) => instance.name === session.selected) ?? session.instances[0];

// Whether the player may do this on the selected instance
export const can = (permission: Permission): boolean => allows(currentInstance(), session.user, permission);

// The last known user and instances, so a returning visitor's pages draw straight away instead of waiting on the API
const CACHE_KEY = 'sessionCache';

// localStorage can hold anything (an older version's data, a browser extension's edits): bad JSON is just missing.
// What it holds is only trusted as far as the callers check it
export function readStored(key: string, fallback: unknown = null): unknown {
	try {
		return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback;
	} catch {
		return fallback;
	}
}

const pickSelected = () => {
	if (!session.instances.some((instance) => instance.name === session.selected))
		session.selected = localStorage.getItem('instance') ?? session.instances[0]?.name ?? '';
};

function setInstances(instances: unknown) {
	if (!Array.isArray(instances)) return;
	session.instances = instances as Instance[];
	pickSelected();
	localStorage.setItem(CACHE_KEY, JSON.stringify({ user: session.user, instances }));
}

// Fills the session from what's already in localStorage; call before the first refresh
export function restore() {
	if (!token()) {
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	const cached = readStored(CACHE_KEY) as { user?: User; instances?: unknown } | null;
	if (!cached?.user || !Array.isArray(cached.instances)) return;
	Object.assign(session, { user: cached.user, instances: cached.instances, loaded: true });
	pickSelected();
}

function loggedOut() {
	localStorage.removeItem(CACHE_KEY);
	Object.assign(session, { user: null, instances: [] });
	disconnectEvents();
}

export async function refresh() {
	if (!token()) {
		localStorage.removeItem(CACHE_KEY);
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	try {
		session.user ??= await api.me();
		setInstances(await api.instances());
		connectEvents();
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) loggedOut();
	}
	session.loaded = true;
}

type Listener = (name: string | null) => void;

// Live updates (aspen's /api/events): the instance list whenever it changes, and a note when an instance's backups or
// one of the player's databases change, for pages showing them. A dropped connection is retried by the next refresh
let events: WebSocket | null = null;
// Not state: nothing renders from it
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const backupListeners = new Set<(instance: string) => void>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const databaseListeners = new Set<Listener>();
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const databaseBackupListeners = new Set<Listener>();

export function connectEvents() {
	if (events || !token()) return;
	const socket = api.events();
	events = socket;
	socket.onmessage = (e: MessageEvent) => {
		const message = parseEvent(e.data);
		switch (message?.type) {
			case 'instances':
				setInstances(message.instances);
				// (Re)connected: whatever changed while the connection was down is read again
				if (!session.live) for (const listener of [...databaseListeners, ...databaseBackupListeners]) listener(null);
				session.live = true;
				break;
			case 'backups':
				for (const listener of backupListeners) listener(message.instance);
				break;
			case 'databaseBackups':
				for (const listener of databaseBackupListeners) listener(message.name);
				break;
			// A database was created or deleted (no name), or one's contents changed
			case 'databases':
				for (const listener of databaseListeners) listener(null);
				break;
			case 'database':
				for (const listener of databaseListeners) listener(message.name);
				break;
		}
	};
	socket.onclose = () => {
		if (events !== socket) return;
		events = null;
		session.live = false;
	};
}

export function disconnectEvents() {
	const socket = events;
	events = null;
	session.live = false;
	socket?.close();
}

// Calls listener(instanceName) whenever that instance's backups change; returns the unsubscribe function
export function onBackupsChanged(listener: (instance: string) => void) {
	backupListeners.add(listener);
	return () => {
		backupListeners.delete(listener);
	};
}

export function select(name: string) {
	session.selected = name;
	localStorage.setItem('instance', name);
}

// Re-reads the instances right after an action changed one, rather than waiting for the next update.
// isLong: start, stop and restart, which aspen only answers once the server has finished (tens of seconds). The live
// updates show the new phase meanwhile, and a dropped connection isn't reported: it says nothing about the server,
// and the updates show what really happened. Errors from aspen itself are still shown
export async function act<T>(action: () => Promise<T>, isLong = false): Promise<T | undefined> {
	const early = isLong && !session.live ? setTimeout(() => void refresh(), 300) : undefined;
	try {
		return await action();
	} catch (error) {
		if (!isLong || error instanceof ApiError) alert(error instanceof Error ? error.message : String(error));
		return undefined;
	} finally {
		clearTimeout(early);
		await refresh();
	}
}

// Calls listener(name) whenever the database `name` changes (a server or the dashboard wrote to it), and listener(null)
// when a database is created or deleted; returns the unsubscribe function
export function onDatabasesChanged(listener: Listener) {
	databaseListeners.add(listener);
	return () => {
		databaseListeners.delete(listener);
	};
}

// Calls listener(name) whenever a database's backups change (made, restored, pruned or deleted), and listener(null)
// after reconnecting; returns the unsubscribe function
export function onDatabaseBackupsChanged(listener: Listener) {
	databaseBackupListeners.add(listener);
	return () => {
		databaseBackupListeners.delete(listener);
	};
}

// A message from /api/events, or null for anything else (bad JSON, missing or mistyped fields)
function parseEvent(data: unknown): EventMessage | null {
	let message: unknown;
	try {
		message = JSON.parse(String(data));
	} catch {
		return null;
	}
	if (typeof message !== 'object' || message === null || !('type' in message)) return null;
	const field = (name: string) => (message as Record<string, unknown>)[name];
	switch (message.type) {
		case 'instances':
			return Array.isArray(field('instances')) ? (message as EventMessage) : null;
		case 'backups':
			return typeof field('instance') === 'string' ? (message as EventMessage) : null;
		case 'database':
		case 'databaseBackups':
			return typeof field('name') === 'string' ? (message as EventMessage) : null;
		case 'databases':
			return message as EventMessage;
		default:
			return null;
	}
}
