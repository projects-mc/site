import { describe, expect, it } from 'vitest';
import { allows } from '#lib/permissions.ts';
import type { Instance, User } from '#lib/types.ts';

const owner: User = { id: 'o', name: 'Owner', admin: false };
const member: User = { id: 'm', name: 'Member', admin: false };
const stranger: User = { id: 's', name: '', admin: false };
const admin: User = { id: 'a', name: '', admin: true };
const instance = {
	owner: { id: 'o', name: 'Owner' },
	members: [{ id: 'm', name: 'Member', permissions: ['power', 'files.write', 'git', 'git.update'] }]
} as unknown as Instance;

describe('allows', () => {
	it('lets owners and admins do anything', () => {
		expect(allows(instance, owner, 'backups.delete')).toBe(true);
		expect(allows(instance, admin, 'console.send')).toBe(true);
	});

	it('lets members do what they were given, with the permission above it', () => {
		expect(allows(instance, member, 'power')).toBe(true);
		expect(allows(instance, member, 'git.update')).toBe(true);
		expect(allows(instance, member, 'console')).toBe(false);
		// files.write without files
		expect(allows(instance, member, 'files.write')).toBe(false);
	});

	it('lets nobody else do anything', () => {
		expect(allows(instance, stranger, 'power')).toBe(false);
		expect(allows(undefined, owner, 'power')).toBe(false);
		expect(allows(instance, null, 'power')).toBe(false);
	});
});
