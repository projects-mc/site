// What aspen's API answers with (aspen/src/api.rs, git.rs, database.rs; documented in docs/architecture.md)
import type { Permission } from '#lib/permissions.ts';

export type Phase = 'starting' | 'running' | 'stopping' | 'stopped';

export interface Player {
	id: string;
	// '' if aspen has never seen their name
	name: string;
}

export interface Member extends Player {
	permissions: Permission[];
}

export interface User {
	id: string;
	name: string;
	admin: boolean;
}

// An instance as /instances and the live updates list it
export interface Instance {
	name: string;
	owner: Player | null;
	members: Member[];
	phase: Phase;
	running: boolean;
	players: number;
	// Bytes
	memory: number;
	memoryMax: number;
	disk: number;
	diskMax: number;
	lobby: boolean;
	motd: string;
	// Whether it follows a git branch, and whether that branch has a commit it isn't on
	git: boolean;
	gitUpdate: boolean;
}

export interface LogInfo {
	// Start time, unix seconds
	id: number;
	start: number;
	// null while it's the running server's log
	end: number | null;
	size: number;
}

export interface FileEntry {
	name: string;
	dir: boolean;
	size: number;
	// Unix seconds
	modified: number;
}

export interface Backup {
	id: string;
	// Unix seconds
	time: number;
	kind: 'auto' | 'manual';
	size: number;
}

export interface Commit {
	hash: string;
	message: string;
	author: string;
	time: number;
}

export interface GitSettings {
	// Masked: https://***@host/...
	url: string;
	branch: string;
	autoReload: boolean;
	pullOnStart: boolean;
}

export interface GitState extends GitSettings {
	commits: Commit[];
	updateAvailable: boolean;
	head?: Commit | null;
	latest?: Commit | null;
	// Tracked files changed on the server
	dirty?: string[];
	warning?: string | null;
	error?: string;
}

// An update or rollback that would overwrite files changed on the server, if not forced
export interface GitDirty {
	dirty: string[];
}

export interface DatabaseInfo {
	name: string;
	created: number;
	size: number;
}

export interface DatabaseList {
	databases: DatabaseInfo[];
	// How many a player may have, and how big each may get (bytes)
	max: number;
	maxSize: number;
}

export interface DatabaseStat {
	size: number;
	keys: number;
}

// A value as the daemon describes it: texts, numbers and booleans have `value`; other types only their type and size
export interface DatabaseValue {
	type: string;
	size: number;
	value?: string | number | boolean;
}

export interface DatabaseKey {
	name: string;
	// A list (a level below); otherwise `value` is the variable's
	children: boolean;
	value?: DatabaseValue;
}

export interface DatabaseKeys {
	children: DatabaseKey[];
	// More after the last one (ask again with `after`)
	more: boolean;
}

export type DatabaseKeyReply = DatabaseValue | { missing: true };

export interface DatabaseBackup {
	id: string;
	time: number;
	kind: 'auto' | 'manual' | 'restore';
	size: number;
}

// Messages on /api/events
export type EventMessage =
	| { type: 'instances'; instances: Instance[] }
	| { type: 'backups'; instance: string }
	| { type: 'databases' }
	| { type: 'database'; name: string }
	| { type: 'databaseBackups'; name: string };
