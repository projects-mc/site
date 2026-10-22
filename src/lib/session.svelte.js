import { api, token, ApiError } from '#lib/api';

// The logged-in player and their instances, shared by every page. aspen pushes changes over a WebSocket (live: it's
// connected); while it isn't, the layout polls instead
export const session = $state({ user: null, instances: [], selected: '', loaded: false, live: false });

export const currentInstance = () =>
	session.instances.find((instance) => instance.name === session.selected) ?? session.instances[0];

// The last known user and instances, so a returning visitor's pages draw straight away instead of waiting on the API
const CACHE_KEY = 'sessionCache';

// localStorage can hold anything (an older version's data, a browser extension's edits): bad JSON is just missing
export function readStored(key, fallback) {
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

function setInstances(instances) {
	if (!Array.isArray(instances)) return;
	session.instances = instances;
	pickSelected();
	localStorage.setItem(CACHE_KEY, JSON.stringify({ user: session.user, instances }));
}

// Fills the session from what's already in localStorage; call before the first refresh
export function restore() {
	if (!token()) {
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	const cached = readStored(CACHE_KEY, null);
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
		if (error.status === 401) loggedOut();
	}
	session.loaded = true;
}

// Live updates (aspen's /api/events): the instance list whenever it changes, and a note when an instance's backups or
// one of the player's databases change, for pages showing them. A dropped connection is retried by the next refresh
let events = null;
// Not state: nothing renders from it
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const backupListeners = new Set();
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const databaseListeners = new Set();
// eslint-disable-next-line svelte/prefer-svelte-reactivity
const databaseBackupListeners = new Set();

export function connectEvents() {
	if (events || !token()) return;
	const socket = api.events();
	events = socket;
	socket.onmessage = (e) => {
		let message;
		try {
			message = JSON.parse(e.data);
		} catch {
			return;
		}
		if (message?.type === 'instances') {
			setInstances(message.instances);
			// (Re)connected: whatever changed while the connection was down is read again
			if (!session.live) for (const listener of [...databaseListeners, ...databaseBackupListeners]) listener(null);
			session.live = true;
		} else if (message?.type === 'backups') {
			for (const listener of backupListeners) listener(message.instance);
		} else if (message?.type === 'databaseBackups') {
			for (const listener of databaseBackupListeners) listener(String(message.name ?? ''));
		} else if (message?.type === 'databases' || message?.type === 'database') {
			// A database was created or deleted (no name), or one's contents changed
			const name = message.type === 'database' ? String(message.name ?? '') : null;
			for (const listener of databaseListeners) listener(name);
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
export function onBackupsChanged(listener) {
	backupListeners.add(listener);
	return () => backupListeners.delete(listener);
}

export function select(name) {
	session.selected = name;
	localStorage.setItem('instance', name);
}

// Re-reads the instances right after an action changed one, rather than waiting for the next update.
// isLong: start, stop and restart, which aspen only answers once the server has finished (tens of seconds). The live
// updates show the new phase meanwhile, and a dropped connection isn't reported: it says nothing about the server,
// and the updates show what really happened. Errors from aspen itself are still shown
export async function act(action, isLong = false) {
	const early = isLong && !session.live && setTimeout(refresh, 300);
	try {
		return await action();
	} catch (error) {
		if (!isLong || error instanceof ApiError) alert(error.message);
	} finally {
		clearTimeout(early);
		await refresh();
	}
}

// Calls listener(name) whenever the database `name` changes (a server or the dashboard wrote to it), and listener(null)
// when a database is created or deleted; returns the unsubscribe function
export function onDatabasesChanged(listener) {
	databaseListeners.add(listener);
	return () => databaseListeners.delete(listener);
}

// Calls listener(name) whenever a database's backups change (made, restored, pruned or deleted), and listener(null)
// after reconnecting; returns the unsubscribe function
export function onDatabaseBackupsChanged(listener) {
	databaseBackupListeners.add(listener);
	return () => databaseBackupListeners.delete(listener);
}
