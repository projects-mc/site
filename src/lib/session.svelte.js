import { api, token, ApiError } from '#lib/api';

// The logged-in player and their instances, shared by every page; refreshed every few seconds while the tab is open
export const session = $state({ user: null, instances: [], selected: '', loaded: false });

export const currentInstance = () =>
	session.instances.find((instance) => instance.name === session.selected) ?? session.instances[0];

// The last known user and instances, so a returning visitor's pages draw straight away instead of waiting on the API
const CACHE_KEY = 'sessionCache';

const pickSelected = () => {
	if (!session.instances.some((instance) => instance.name === session.selected))
		session.selected = localStorage.getItem('instance') ?? session.instances[0]?.name ?? '';
};

// Fills the session from what's already in localStorage; call before the first refresh
export function restore() {
	if (!token()) {
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
	if (!cached) return;
	Object.assign(session, { user: cached.user, instances: cached.instances, loaded: true });
	pickSelected();
}

export async function refresh() {
	if (!token()) {
		localStorage.removeItem(CACHE_KEY);
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	try {
		session.user ??= await api.me();
		session.instances = await api.instances();
		pickSelected();
		localStorage.setItem(CACHE_KEY, JSON.stringify({ user: session.user, instances: session.instances }));
	} catch (error) {
		if (error.status === 401) {
			localStorage.removeItem(CACHE_KEY);
			Object.assign(session, { user: null, instances: [] });
		}
	}
	session.loaded = true;
}

export function select(name) {
	session.selected = name;
	localStorage.setItem('instance', name);
}

// Re-reads the instances right after an action changed one, rather than waiting for the next refresh.
// isLong: start, stop and restart, which aspen only answers once the server has finished (tens of seconds). The new
// phase is read straight away instead, and a dropped connection isn't reported: it says nothing about the server,
// and the regular refreshes show what really happened. Errors from aspen itself are still shown
export async function act(action, isLong = false) {
	const early = isLong && setTimeout(refresh, 300);
	try {
		return await action();
	} catch (error) {
		if (!isLong || error instanceof ApiError) alert(error.message);
	} finally {
		clearTimeout(early);
		await refresh();
	}
}
