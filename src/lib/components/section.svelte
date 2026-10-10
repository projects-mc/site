<script>
    import Admonition from '#lib/components/admonition.svelte';
    import Carousel from '#lib/components/carousel.svelte';
    let {
        link,
        titleText,
        icon,
        right,
        data,
        carousel
    } = $props();
</script>


<div class="section" class:right={right}>
    <a href={link} class="notextdeco"><h2>{titleText}</h2></a>
    {#if carousel}
        <Carousel smallSlide data={data}></Carousel>
    {:else}
        <div class="cardListContainer">
            {#if data.length < 1}
                <Admonition error>No connection to outside server! Posts could not be shown.</Admonition>
            {:else}
            {#each data as { title, link }}
                <div class="listCard card backgroundIcon" style="--bg: url(/media/icons/{icon}.svg)">
                    <a href={link} target="_blank" rel="noreferrer noopener" style="text-decoration: none;">
                        <h1>{title}</h1>
                        <div class="contentFader"></div>
                    </a>
                </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>
