// The dashboard's only backend is aspen's API, at VITE_API_URL (see .env.example). The session token from logging in
// is kept in localStorage and sent with every request.
const base = (import.meta.env.VITE_API_URL ?? 'https://api.playboardmc.com').replace(/\/$/, '') + '/api';
const TOKEN_KEY = 'session';

export const token = () => localStorage.getItem(TOKEN_KEY);

export class ApiError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

async function request(method, path, { json, body } = {}) {
	const headers = { Authorization: `Bearer ${token()}` };
	if (json !== undefined) {
		headers['Content-Type'] = 'application/json';
		body = JSON.stringify(json);
	}
	const response = await fetch(base + path, { method, headers, body });
	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		if (response.status === 401) localStorage.removeItem(TOKEN_KEY);
		throw new ApiError(response.status, error.error ?? `Request failed (${response.status})`);
	}
	return response;
}

const json = async (method, path, options) => {
	const response = await request(method, path, options);
	return response.status === 204 ? null : response.json();
};
const text = async (path) => (await request('GET', path)).text();
const at = (name) => `/instances/${encodeURIComponent(name)}`;
const db = (name) => `/databases/${encodeURIComponent(name)}`;
const keysQuery = (prefix, after) =>
	`?prefix=${encodeURIComponent(prefix)}${after ? `&after=${encodeURIComponent(after)}` : ''}`;
const query = (path) => `?path=${encodeURIComponent(path)}`;
// Links the browser opens by itself can't send headers, so they carry the token
const link = (path) => `${base}${path}${path.includes('?') ? '&' : '?'}token=${token()}`;

export const api = {
	async login(code) {
		const { token } = await json('POST', '/login', { json: { code } });
		localStorage.setItem(TOKEN_KEY, token);
	},
	async logout() {
		await json('POST', '/logout').catch(() => {});
		localStorage.removeItem(TOKEN_KEY);
	},
	me: () => json('GET', '/me'),
	// Live updates: see connectEvents in session.svelte.js
	events: () => new WebSocket(link('/events').replace(/^http/, 'ws')),

	instances: () => json('GET', '/instances'),
	create: (name) => json('POST', '/instances', { json: { name } }),
	remove: (name) => json('DELETE', at(name)),
	start: (name) => json('POST', `${at(name)}/start`),
	stop: (name) => json('POST', `${at(name)}/stop`),
	restart: (name) => json('POST', `${at(name)}/restart`),
	// player: a Minecraft UUID, or the name of a player who has used the dashboard
	addMember: (name, player) => json('POST', `${at(name)}/members`, { json: { player } }),
	removeMember: (name, id) => json('DELETE', `${at(name)}/members/${encodeURIComponent(id)}`),
	// The description in the lobby's game picker (motd in its settings), MiniMessage with <br> between lines
	setMotd: (name, motd) => json('PUT', `${at(name)}/motd`, { json: { motd } }),
	// The server's settings file (settings.toml), downloaded and uploaded whole; read when the server next starts
	settingsLink: (name) => link(`${at(name)}/settings`),
	putSettings: (name, text) => json('PUT', `${at(name)}/settings`, { body: text }),
	console: (name) => new WebSocket(link(`${at(name)}/console`).replace(/^http/, 'ws')),

	logs: (name) => json('GET', `${at(name)}/logs`),
	log: (name, id) => text(`${at(name)}/logs/${id}`),

	files: (name, path) => json('GET', `${at(name)}/files${query(path)}`),
	readFile: (name, path) => text(`${at(name)}/file${query(path)}`),
	writeFile: (name, path, contents) => json('PUT', `${at(name)}/file${query(path)}`, { body: contents }),
	deleteFile: (name, path) => json('DELETE', `${at(name)}/file${query(path)}`),
	mkdir: (name, path) => json('POST', `${at(name)}/mkdir${query(path)}`),
	rename: (name, from, to) => json('POST', `${at(name)}/rename`, { json: { from, to } }),
	fileLink: (name, path) => link(`${at(name)}/file${query(path)}`),
	downloadLink: (name) => link(`${at(name)}/download`),

	backups: (name) => json('GET', `${at(name)}/backups`),
	backUp: (name) => json('POST', `${at(name)}/backups`),
	restore: (name, id) => json('POST', `${at(name)}/backups/${id}/restore`),
	deleteBackup: (name, id) => json('DELETE', `${at(name)}/backups/${id}`),
	backupLink: (name, id) => link(`${at(name)}/backups/${id}/download`),

	// The server's git repository (aspen's git.rs): its state (fetches the branch), the settings (an empty url removes
	// it; the masked url as shown keeps the saved one), and updating or rolling back. commit null is the branch's
	// latest; without force, files changed on the server stop it with {dirty: [paths]}
	git: (name) => json('GET', `${at(name)}/git`),
	gitSettings: (name, settings) => json('PUT', `${at(name)}/git`, { json: settings }),
	gitCheckout: (name, commit, force) => json('POST', `${at(name)}/git/checkout`, { json: { commit, force } }),

	// The player's databases: variables {name::...} shared by all of their servers
	databases: () => json('GET', '/databases'),
	createDatabase: (name) => json('POST', '/databases', { json: { name } }),
	deleteDatabase: (name) => json('DELETE', db(name)),
	databaseStat: (name) => json('GET', `${db(name)}/stat`),
	// One level of variables under prefix ('' or 'list::'), 200 at a time after the name `after`
	databaseKeys: (name, prefix, after) =>
		json('GET', `${db(name)}/keys${keysQuery(prefix, after)}`),
	databaseKey: (name, key) => json('GET', `${db(name)}/key?key=${encodeURIComponent(key)}`),
	// type: 'string', 'number' or 'boolean'
	setDatabaseKey: (name, key, type, value) => json('PUT', `${db(name)}/key`, { json: { key, type, value } }),
	// list: delete everything under key:: instead of key itself
	deleteDatabaseKey: (name, key, list = false) =>
		json('DELETE', `${db(name)}/key?key=${encodeURIComponent(key)}${list ? '&list=true' : ''}`),
	databaseDownloadLink: (name) => link(`${db(name)}/download`),

	// A database's backups: [{ id, time, kind ('auto', 'manual' or 'restore': what it held before a restore), size }]
	databaseBackups: (name) => json('GET', `${db(name)}/backups`),
	backUpDatabase: (name) => json('POST', `${db(name)}/backups`),
	deleteDatabaseBackup: (name, id) => json('DELETE', `${db(name)}/backups/${id}`),
	// Servers using it keep running and see the restored contents straight away
	restoreDatabase: (name, id) => json('POST', `${db(name)}/backups/${id}/restore`),
	databaseBackupLink: (name, id) => link(`${db(name)}/backups/${id}/download`),
	databaseBackupKeys: (name, id, prefix, after) =>
		json('GET', `${db(name)}/backups/${id}/keys${keysQuery(prefix, after)}`),
	databaseBackupKey: (name, id, key) => json('GET', `${db(name)}/backups/${id}/key?key=${encodeURIComponent(key)}`)
};
