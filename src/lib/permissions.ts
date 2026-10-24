// What an owner can let each member do (aspen's store::PERMISSIONS, in its order). One with a dot also needs the one
// before it: files.write needs files
import type { Instance, User } from '#lib/types.ts';

export const PERMISSIONS = [
	['power', 'Start, stop and restart'],
	['console', 'See the console'],
	['console.send', 'Run console commands'],
	['logs', 'Read old logs'],
	['files', 'See files'],
	['files.write', 'Change, upload and delete files'],
	['files.download', 'Download all files'],
	['settings', 'Change settings and the description'],
	['backups', 'See backups'],
	['backups.create', 'Make backups'],
	['backups.restore', 'Restore backups'],
	['backups.delete', 'Delete backups'],
	['backups.download', 'Download backups'],
	['git', 'See git'],
	['git.update', 'Update and roll back from git'],
	['git.settings', 'Change the git repository']
] as const;

export type Permission = (typeof PERMISSIONS)[number][0];

// The owner and admins may do anything; a member what the owner allowed
export function allows(instance: Instance | undefined, user: User | null, permission: Permission): boolean {
	if (!instance || !user) return false;
	if (user.admin || instance.owner?.id === user.id) return true;
	const granted = instance.members.find((member) => member.id === user.id)?.permissions ?? [];
	const parent = permission.split('.')[0] as Permission;
	return granted.includes(permission) && granted.includes(parent);
}
