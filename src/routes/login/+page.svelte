<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Title from '#lib/components/title.svelte';
	import { api } from '#lib/api';
	import { session, refresh } from '#lib/session.svelte.js';

	// /dashboard in the lobby links here with a one-time code after the #, which never reaches any server log
	let error = $state('');

	onMount(async () => {
		const code = location.hash.slice(1);
		history.replaceState(null, '', '/login');
		if (!code) {
			error = 'This link is missing its code. Type /dashboard in the lobby for a new one.';
			return;
		}
		try {
			await api.login(code);
			session.user = null;
			await refresh();
			goto(resolve('/'), { replaceState: true });
		} catch (e) {
			error = e.message;
		}
	});
</script>

<Title name="Log in"/>
<p>{error || 'Logging you in...'}</p>
