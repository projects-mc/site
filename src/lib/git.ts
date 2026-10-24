import { api } from '#lib/api.ts';
import type { GitDirty, GitState } from '#lib/types.ts';

// What checkout answers when it would overwrite files changed on the server (a state always has its commits)
const isDirty = (reply: GitState | GitDirty): reply is GitDirty => !('commits' in reply);

// Puts the server on a commit (null: the branch's latest), asking first if that overwrites files changed on the
// server. Returns the new state, or null if the player said no
export async function checkout(name: string, commit: string | null): Promise<GitState | null> {
	const reply = await api.gitCheckout(name, commit, false);
	if (!isDirty(reply)) return reply;
	if (!confirm(`These files were changed on this server and will be overwritten:\n${fileList(reply.dirty)}`)) return null;
	const forced = await api.gitCheckout(name, commit, true);
	return isDirty(forced) ? null : forced;
}

export function fileList(files: string[], max = 10) {
	const shown = files.slice(0, max).join('\n');
	return files.length > max ? `${shown}\n...and ${files.length - max} more` : shown;
}
