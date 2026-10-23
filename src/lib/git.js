import { api } from '#lib/api';

// Puts the server on a commit (null: the branch's latest), asking first if that overwrites files changed on the
// server. Returns the new state, or null if the player said no
export async function checkout(name, commit) {
	let reply = await api.gitCheckout(name, commit, false);
	if (reply.dirty) {
		if (!confirm(`These files were changed on this server and will be overwritten:\n${fileList(reply.dirty)}`)) return null;
		reply = await api.gitCheckout(name, commit, true);
	}
	return reply;
}

export function fileList(files, max = 10) {
	const shown = files.slice(0, max).join('\n');
	return files.length > max ? `${shown}\n...and ${files.length - max} more` : shown;
}
