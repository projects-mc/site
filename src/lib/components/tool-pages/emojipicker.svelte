<script>
    import Admonition from '#lib/components/admonition.svelte';
    import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
	const transition = { y: 10, duration: 250, easing: cubicOut };

    // TODO Switch to CSR on this page to improve page load speed
    import { commonIcons } from '#lib/components/tool-pages/emojipicker.js';
    const iconList = commonIcons.split('');
    let showCopyMessage = $state(), alreadyCopied = $state(), isOpen = $state(false);
    let randomID;
    function copy(event) {
        // Copy text and show admonition
        navigator.clipboard.writeText(event.target.innerText);

        if (showCopyMessage == true) {
            // If the admonition is already shown, let's play a pop animation
            alreadyCopied = true;
            setTimeout(() => { alreadyCopied = false }, 100);
        };

        showCopyMessage = true;
        
        // Get a random ID so if the user spams the button it won't glitch
        let localRandom;
        localRandom = randomID = Math.random();

        // After 3 seconds, hide the admonition
        setTimeout(() => { 
            if (randomID == localRandom)
                showCopyMessage = false
        }, 3000);
    };
    
    const togglePopup = () => isOpen = !isOpen;
</script>

<Admonition error>This tool is not finished, please check back later</Admonition>
<br><br>

<p>
    Use the buttons below to copy the character you want.

    This list only includes characters in the font mappings
    but any Unicode character will work (with an odd texture).
</p>


<div class="card">
    <h3>More characters</h3>
    Taking screenshots of each character is time-consuming, 
    so only commonly-used characters are shown. Characters
    shown below do not have an in-game preview.
</div>

{#each iconList as icon}
    <button onclick={copy}>{icon}</button>
{/each}

<div class="card">
    <p><b>Disclaimer:</b> I am not affiliated with Mojang or Microsoft. Preview images are from the offical Minecraft font and are copyrighted by their respective owner(s).</p>
</div>

<div class="card">
    <h3>Character list</h3>
    Want a full list of all characters?
    <button type="button" onclick={() => togglePopup()}>Copy plaintext list of all characters</button>
    All characters are copied from the font mappings of the Minecraft 1.20 jar.
</div>

{#if showCopyMessage}
    <p class="stickyAdmonition" in:fly|local={transition} out:fly|local={transition} class:alreadyCopied={alreadyCopied}>Copied!</p>
{/if}

{#if isOpen}

<!-- svelte-ignore a11y_click_events_have_key_events (Warning can be ignored safely since this is an alias) -->
<div class="popupBg" tabindex="0" role="button" onclick={togglePopup} in:fly|local={transition} out:fly|local={transition}></div>
<div class="popup card" in:fly|local={transition} out:fly|local={transition}>
    <button onclick={togglePopup}>Close</button>
    not finished
</div>
{/if}