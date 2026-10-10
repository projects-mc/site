<script>
	import Hero from '#lib/components/hero.svelte';
	import Section from '#lib/components/section.svelte';
	import ImgCardList from '#lib/components/imgCardList.svelte';
	import { navItems } from '#lib/config';

	// Necessary for the journal post system
	let { data } = $props();
	let { journalPosts } = $derived(data);
	let { projectItems } = $derived(data);
</script>

<svelte:head>
	<link rel="stylesheet" href="/css/lists.css"/>
	<link rel="stylesheet" href="/css/carousel.css"/>
	<title>Home</title>
</svelte:head>
<Hero>
	<h1>AmazinAxel</h1>
</Hero>

<!-- Projects list -->
<Section carousel link="projects" titleText="My Projects" icon="projects" right data={ projectItems }/>

<!-- Journal posts
<Section link="https://journal.amazinaxel.com" titleText="What I'm writing about" icon="journal" data={ journalPosts }/> -->
	
<!-- Minecraft utilities -->
<div class="section right">
	<h2>Minecraft Utilities</h2>
	<ImgCardList data={navItems[3].subitems} alt="Picture of"/>
</div>