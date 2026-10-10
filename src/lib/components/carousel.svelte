<script>
  import emblaCarouselSvelte from 'embla-carousel-svelte';

  let { data, smallSlide, emblaAPI = $bindable() } = $props();
  let currentlySelected = $state(0);
  let options = { loop: true, watchSlides: false };
  function initAPI(event) { emblaAPI = event.detail; emblaAPI.on('select', onSlideMoved); }

  function onSlideMoved() { 
    currentlySelected = emblaAPI.selectedScrollSnap();
  }
</script>

<section class="embla" use:emblaCarouselSvelte={{ options }} onemblaInit={initAPI}>
  <div class="embla__container">
    {#each data as { title, role, description, shortDesc, image, url, linkText, lightBackground }}
      <div class="embla__slide" class:smallSlide={smallSlide}>
        <div class="carouselContent" class:lightBackground={lightBackground}>
          <div class="name"><h4>{title}</h4></div>
          {#if !smallSlide}<h6>{role}</h6>{/if}
          <p>{(smallSlide) ? shortDesc : description}</p>
          {#if linkText} <a href={url}>{linkText}</a> {/if}
        </div>
        <img src="/media/herobanners/{image}" alt="Background hero of {title} - {description}">
      </div>
    {/each}
  </div>
  {#if data.length != 1}
  {#if !smallSlide}<button class="embla__prev" onclick={() => emblaAPI.scrollPrev()}><img class="noImgStyle" src="/media/icons/arrow-left.svg" alt="Left arrow"></button>{/if}
  <button class="embla__next" onclick={() => emblaAPI.scrollNext()}><img class="noImgStyle" src="/media/icons/arrow-right.svg" alt="Right arrow"></button>
  <div class="embla__dots">
    {#if emblaAPI}
      {#each data as _, i}
        <span class:embla__dot={true} role="button" tabindex="0" class:selected={currentlySelected == i} onkeydown={() => emblaAPI.scrollTo(i)} onclick={() => emblaAPI.scrollTo(i)}></span> 
      {/each} 
    {/if}
    </div>
  {/if}
</section>
