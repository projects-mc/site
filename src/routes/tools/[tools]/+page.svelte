<script>
    let { data } = $props();
    let { pageContent } = $derived(data);
    import { navItems } from '#lib/config';
    import { page } from '$app/state';
    
    let title = $state();

    // Loop each tool item and compare their route
    // If route matches, set the title
    for (let i = 0; i < navItems[3].subitems.length; i++) {
        let navItem = navItems[3].subitems[i];
        
        if (page.url.pathname.includes(navItem.route)) 
            title = navItem.title
    }

    const SvelteComponent = $derived(pageContent);
</script>

<svelte:head> <!-- Custom title ending -->
	<title>{ title } - Axel's Utils</title>
</svelte:head>

<SvelteComponent/>