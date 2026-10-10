<script>
    let { data, alt } = $props();
</script>

<div style="display: flex; gap: 0.5rem; align-items: center; margin: auto;">
    {#each data as item}
        <a href="/tools/{item.route}" style="text-decoration: none;" class="gridItem">
            <div class="card imgCard">
                <picture>
                    <img src="/media/tools/previews/{item.image}" class="noImgStyle" style="border-radius: 0.5rem" alt={alt}>
                </picture>
                <h3>{item.title}</h3>
                <div class="contentFader"></div>
            </div>
        </a>
    {/each}
</div>