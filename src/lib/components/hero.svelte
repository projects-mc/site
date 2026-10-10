<script>
    // Get all projects
    import { heroItems } from '#lib/config';
    import { shuffle } from '#lib/utils'

    let { children } = $props();
    
    let showHero = $state(false);
    
    const randomHero = shuffle(heroItems)[0]; // Random project
    const image = shuffle(randomHero.images)[0] // Random image from project
</script>

<div id="hero" style="--heroBackground: url(/media/herobanners/{ image.image })" class:invertColors={image.invertColors} class:heroShow={showHero}>
    {@render children?.()}
    <span
        role="article"
        onmouseenter={() => (showHero = true)} 
        onmouseleave={() => (showHero = false)}
        aria-label="Open hero information"
    >{randomHero.project} <span>- {randomHero.description} </span></span>
</div>