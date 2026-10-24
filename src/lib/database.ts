// Helpers for browsing a database's variables. A level is a prefix: '' for the top, else the names down to it, each
// followed by '::' ({stats::coins::*} is the level 'coins::' of the database stats)
import type { DatabaseValue } from '#lib/types.ts';

const SEPARATOR = '::';

// The level one step into `name`
export const enter = (prefix: string, name: string) => prefix + name + SEPARATOR;

// The breadcrumbs of a level: from the top down, each leading to its own level
export function crumbs(prefix: string): { name: string; prefix: string }[] {
	const names = prefix.split(SEPARATOR).slice(0, -1);
	return names.map((name, i) => ({
		name,
		prefix: names.slice(0, i + 1).join(SEPARATOR) + SEPARATOR
	}));
}

// How scripts write a variable: {stats::coins::alice}
export const scriptName = (database: string, key: string) => `{${database}${SEPARATOR}${key}}`;

// What the dashboard shows for a value: texts, numbers and booleans as they are, anything else by its type
export function show(value: DatabaseValue | null | undefined) {
	if (!value) return '';
	if (value.value !== undefined) return typeof value.value === 'string' ? JSON.stringify(value.value) : String(value.value);
	return `${value.type} (${value.size} bytes)`;
}

export type EditType = 'string' | 'number' | 'boolean';

// The editor's type for a value; null if the dashboard can't edit it
export function editType(value: DatabaseValue | null | undefined): EditType | null {
	if (value?.value === undefined) return null;
	if (typeof value.value === 'number') return 'number';
	if (typeof value.value === 'boolean') return 'boolean';
	return 'string';
}

// A variable name typed into the dashboard, checked like Skript does: no empty parts, no '*'
export function validKey(key: string) {
	if (!key || key.includes('*')) return false;
	return key.split(SEPARATOR).every((part) => part.length > 0);
}

// A database name, checked like aspen does (aspen has the last word)
export function validName(name: string) {
	return (
		name.length >= 1 &&
		Array.from(name).length <= 32 && // characters (code points), as aspen counts them
		!/[/\\%{}*:"\p{Cc}]/u.test(name) &&
		!/^[_\-. ]/.test(name) &&
		!name.endsWith(' ')
	);
}
