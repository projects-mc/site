<script>
    let {
        error,
        warning,
        important,
        note,
        info = false,
        size = 20,
        style = "",
        children
    } = $props();

    let [t, i] = $derived(
        error ? ['error', 'error']
        : warning ? ['warning', 'warning']
        : important ? ['important', 'warning']
        : note ? ['note', 'about']
        : info ? ['info', 'about']
        : [undefined, undefined]
    );
</script>

<div class="coverCard {t} innerCard" style="--bg: url(/media/icons/{i}.svg); --size: {size}rem;{style}">{@render children?.()}</div>
