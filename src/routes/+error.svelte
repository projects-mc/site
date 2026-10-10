<script>
    import { page } from '$app/state';
	import { onMount } from "svelte"; 
	import Hero from '#lib/components/hero.svelte';
	import Title from '#lib/components/title.svelte';
	let quote = $state(), author = $state();
	let visibility = $state(false);

	onMount(getQuote);

	function getQuote() {
		visibility = false;

		// Wait a second 
		setTimeout(() => {
			// Get a random quote from a quote API and display it
			fetch('https://qapi.vercel.app/api/random') // Quotable API is down - use this endpoint for now
				.then(response => response.ok ? response.json() : Promise.reject('An error occurred while fetching a quote.'))
				.then(data => { quote = data.quote; author = data.author;})
				.then(() => { visibility = true; });
		}, 500);
	};
</script>

<Title name="Error {page.status}" dontShowHeader/>

<Hero>
	<h1>Error {page.status}: {page.error.message}</h1>
	<p>Something went wrong. Try <a href="/" >heading back to the homepage.</a></p>
</Hero>

<div class="card nomargin quoteParent" style="position: relative;" class:visible={visibility}>
	<blockquote>
		<p>{quote}</p>
		<p><em>- {author}</em></p>
	</blockquote>
	<button class="nostyle" style="
		position: absolute;
		right: 0.5rem;
		bottom: 0.2rem;
    	color: var(--blue2);
		background: none;
		border: 0;
		cursor: pointer;
	" 
	onclick={() => getQuote()}> New quote </button>
</div>