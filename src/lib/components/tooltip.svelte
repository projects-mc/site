<script>
    let {
        inlineText,
        isIcon = false,
        style = '',
        click = '',
        children
    } = $props();
</script>

<div class="tooltip" style={style}>
    {#if isIcon}
        <img src="/media/icons/about.svg" alt="About tooltip" class="noImgStyle">
    {:else}
        <span onclick={click} onkeydown={click} role="button" tabindex="0">{@html inlineText}</span>
    {/if}
    <span class="tooltiptext">
        {@render children?.()}
    </span>
</div>
