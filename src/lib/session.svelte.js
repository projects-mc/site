import { api, token } from '#lib/api';

// The logged-in player and their instances, shared by every page; refreshed every few seconds while the tab is open
export const session = $state({ user: null, instances: [], selected: '', loaded: false });

export const currentInstance = () =>
	session.instances.find((instance) => instance.name === session.selected) ?? session.instances[0];

export async function refresh() {
	if (!token()) {
		Object.assign(session, { user: null, instances: [], loaded: true });
		return;
	}
	try {
		session.user ??= await api.me();
		session.instances = await api.instances();
		if (!session.instances.some((instance) => instance.name === session.selected))
			session.selected = localStorage.getItem('instance') ?? session.instances[0]?.name ?? '';
	} catch (error) {
		if (error.status === 401) Object.assign(session, { user: null, instances: [] });
	}
	session.loaded = true;
}

export function select(name) {
	session.selected = name;
	localStorage.setItem('instance', name);
}

// Re-reads the instances right after an action changed one, rather than waiting for the next refresh
export async function act(action) {
	try {
		return await action();
	} catch (error) {
		alert(error.message);
	} finally {
		await refresh();
	}
}
