<script>
	import { page } from '$app/state';
	import Title from '#lib/components/title.svelte';
</script>

<Title name="Error {page.status}" dontShowHeader/>

<h1>Error {page.status}: {page.error?.message}</h1>
<p>Something went wrong. Try <a href="/">heading back to the homepage.</a></p>
