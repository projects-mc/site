<script>
    import Title from '#lib/components/title.svelte';
	import Carousel from '#lib/components/carousel.svelte';

	import { projects } from '#lib/config';
</script>
<svelte:head>
	<link rel="stylesheet" href="/css/carousel.css"/>
</svelte:head>

<Title name="Projects"/>

<Carousel data={projects.major}/>


<h2>Other <span class="subtext">Side projects</span></h2>

<Carousel data={projects.other}/>