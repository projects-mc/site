// The dashboard's only backend is aspen's API, at VITE_API_URL (see .env.example). The session token from logging in
// is kept in localStorage and sent with every request.
import type {
	Backup,
	DatabaseBackup,
	DatabaseKeyReply,
	DatabaseKeys,
	DatabaseList,
	DatabaseStat,
	FileEntry,
	GitDirty,
	GitSettings,
	GitState,
	Instance,
	LogInfo,
	User
} from '#lib/types.ts';

const base = (import.meta.env.VITE_API_URL ?? 'https://api.playboardmc.com').replace(/\/$/, '') + '/api';
const TOKEN_KEY = 'session';

export const token = () => localStorage.getItem(TOKEN_KEY);

export class ApiError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

interface Options {
	json?: unknown;
	body?: BodyInit;
}

async function request(method: string, path: string, { json, body }: Options = {}): Promise<Response> {
	const headers: Record<string, string> = { Authorization: `Bearer ${token()}` };
	if (json !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(json);
	}
	const response = await fetch(base + path, { method, headers, body });
	if (!response.ok) {
		const error: unknown = await response.json().catch(() => null);
		if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
		const message =
			typeof error === 'object' && error !== null && 'error' in error && typeof error.error === 'string'
				? error.error
				: `Request failed (${response.status})`;
		throw new ApiError(response.status, message);
	}
	return response;
}

// The answer as T (aspen's types are in types.ts), or null for 204 No Content
async function json<T = null>(method: string, path: string, options?: Options): Promise<T> {
	const response = await request(method, path, options);
	const body: unknown = response.status === 204 ? null : await response.json();
	return body as T;
}
const text = async (path: string) => (await request('GET', path)).text();
const at = (name: string) => `/instances/${encodeURIComponent(name)}`;
const db = (name: string) => `/databases/${encodeURIComponent(name)}`;
const keysQuery = (prefix: string, after?: string) =>
	`?prefix=${encodeURIComponent(prefix)}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
const query = (path: string) => `?path=${encodeURIComponent(path)}`;
// Links the browser opens by itself can't send headers, so they carry the token
const link = (path: string) => `${base}${path}${path.includes('?') ? '&' : '?'}token=${token()}`;
const socket = (path: string) => new WebSocket(link(path).replace(/^http/, 'ws'));

export const api = {
	async login(code: string) {
		const { token } = await json<{ token: string }>('POST', '/login', { json: { code } });
		localStorage.setItem(TOKEN_KEY, token);
	},
	async logout() {
		await json('POST', '/logout').catch(() => {});
		localStorage.removeItem(TOKEN_KEY);
	},
	me: () => json<User>('GET', '/me'),
	// Live updates: see connectEvents in session.svelte.ts
	events: () => socket('/events'),

	instances: () => json<Instance[]>('GET', '/instances'),
	create: (name: string) => json<Instance>('POST', '/instances', { json: { name } }),
	remove: (name: string) => json('DELETE', at(name)),
	start: (name: string) => json<Instance>('POST', `${at(name)}/start`),
	stop: (name: string) => json<Instance>('POST', `${at(name)}/stop`),
	restart: (name: string) => json<Instance>('POST', `${at(name)}/restart`),
	// player: a Minecraft UUID, or the name of a player who has used the dashboard
	addMember: (name: string, player: string) => json<Instance>('POST', `${at(name)}/members`, { json: { player } }),
	removeMember: (name: string, id: string) => json('DELETE', `${at(name)}/members/${encodeURIComponent(id)}`),
	// The description in the lobby's game picker (motd in its settings), MiniMessage with <br> between lines
	setMotd: (name: string, motd: string) => json<Instance>('PUT', `${at(name)}/motd`, { json: { motd } }),
	// The server's settings file (settings.toml), downloaded and uploaded whole; read when the server next starts
	settingsLink: (name: string) => link(`${at(name)}/settings`),
	putSettings: (name: string, text: string) => json<Instance>('PUT', `${at(name)}/settings`, { body: text }),
	console: (name: string) => socket(`${at(name)}/console`),

	logs: (name: string) => json<LogInfo[]>('GET', `${at(name)}/logs`),
	log: (name: string, id: number) => text(`${at(name)}/logs/${id}`),

	files: (name: string, path: string) => json<FileEntry[]>('GET', `${at(name)}/files${query(path)}`),
	readFile: (name: string, path: string) => text(`${at(name)}/file${query(path)}`),
	writeFile: (name: string, path: string, contents: BodyInit) =>
		json('PUT', `${at(name)}/file${query(path)}`, { body: contents }),
	deleteFile: (name: string, path: string) => json('DELETE', `${at(name)}/file${query(path)}`),
	mkdir: (name: string, path: string) => json('POST', `${at(name)}/mkdir${query(path)}`),
	rename: (name: string, from: string, to: string) => json('POST', `${at(name)}/rename`, { json: { from, to } }),
	fileLink: (name: string, path: string) => link(`${at(name)}/file${query(path)}`),
	downloadLink: (name: string) => link(`${at(name)}/download`),

	backups: (name: string) => json<Backup[]>('GET', `${at(name)}/backups`),
	backUp: (name: string) => json('POST', `${at(name)}/backups`),
	restore: (name: string, id: string) => json('POST', `${at(name)}/backups/${id}/restore`),
	deleteBackup: (name: string, id: string) => json('DELETE', `${at(name)}/backups/${id}`),
	backupLink: (name: string, id: string) => link(`${at(name)}/backups/${id}/download`),

	// The server's git repository (aspen's git.rs): its state (fetches the branch), the settings (an empty url removes
	// it; the masked url as shown keeps the saved one), and updating or rolling back. commit null is the branch's
	// latest; without force, files changed on the server stop it with {dirty: [paths]}
	git: (name: string) => json<GitState>('GET', `${at(name)}/git`),
	gitSettings: (name: string, settings: Pick<GitSettings, 'url' | 'branch'> & Partial<GitSettings>) =>
		json<GitState>('PUT', `${at(name)}/git`, { json: settings }),
	gitCheckout: (name: string, commit: string | null, force: boolean) =>
		json<GitState | GitDirty>('POST', `${at(name)}/git/checkout`, { json: { commit, force } }),

	// The player's databases: variables {name::...} shared by all of their servers
	databases: () => json<DatabaseList>('GET', '/databases'),
	createDatabase: (name: string) => json('POST', '/databases', { json: { name } }),
	deleteDatabase: (name: string) => json('DELETE', db(name)),
	databaseStat: (name: string) => json<DatabaseStat>('GET', `${db(name)}/stat`),
	// One level of variables under prefix ('' or 'list::'), 200 at a time after the name `after`
	databaseKeys: (name: string, prefix: string, after?: string) =>
		json<DatabaseKeys>('GET', `${db(name)}/keys${keysQuery(prefix, after)}`),
	databaseKey: (name: string, key: string) =>
		json<DatabaseKeyReply>('GET', `${db(name)}/key?key=${encodeURIComponent(key)}`),
	// A number is sent as text, so no precision is lost on the way
	setDatabaseKey: (name: string, key: string, type: 'string' | 'number' | 'boolean', value: string | boolean) =>
		json('PUT', `${db(name)}/key`, { json: { key, type, value } }),
	// list: delete everything under key:: instead of key itself
	deleteDatabaseKey: (name: string, key: string, list = false) =>
		json('DELETE', `${db(name)}/key?key=${encodeURIComponent(key)}${list ? '&list=true' : ''}`),
	databaseDownloadLink: (name: string) => link(`${db(name)}/download`),

	// A database's backups ('restore': what it held before a restore)
	databaseBackups: (name: string) => json<DatabaseBackup[]>('GET', `${db(name)}/backups`),
	backUpDatabase: (name: string) => json('POST', `${db(name)}/backups`),
	deleteDatabaseBackup: (name: string, id: string) => json('DELETE', `${db(name)}/backups/${id}`),
	// Servers using it keep running and see the restored contents straight away
	restoreDatabase: (name: string, id: string) => json('POST', `${db(name)}/backups/${id}/restore`),
	databaseBackupLink: (name: string, id: string) => link(`${db(name)}/backups/${id}/download`),
	databaseBackupKeys: (name: string, id: string, prefix: string, after?: string) =>
		json<DatabaseKeys>('GET', `${db(name)}/backups/${id}/keys${keysQuery(prefix, after)}`),
	databaseBackupKey: (name: string, id: string, key: string) =>
		json<DatabaseKeyReply>('GET', `${db(name)}/backups/${id}/key?key=${encodeURIComponent(key)}`)
};
