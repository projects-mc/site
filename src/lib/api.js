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

	gitPull: (name, url, branch) => json('POST', `${at(name)}/git`, { json: { url, branch } })
};
