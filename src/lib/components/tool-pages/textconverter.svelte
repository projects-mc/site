<script>
	import Tooltip from '#lib/components/tooltip.svelte';

    var inputText = $state();
    var outputText = $state();
    let textType = $state(false);
    let scriptType = $state(2);

    const normalAlphabet = 'abcdefghijklmnopqrstuvwxyz*';
    const smallTextChars = 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴoᴘꞯʀsᴛᴜᴠᴡxʏᴢ⋆';
    const altTextChars = 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴoᴘǫʀsᴛᴜᴠᴡxʏᴢ';

    const scriptChars = '0123456789+-=()';
    const superChars = '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾';
    const subChars = '₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎';

    function convertText(toSmallText = true) {
        let preConvertedText = '';

        var text = (toSmallText) ? inputText.toLowerCase() : outputText;
        
        // Get character type
        const chars = textType ? smallTextChars : altTextChars;
        const scriptTypeChars = (scriptType == 1) ? subChars : superChars;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Set character and fall back if char is not found in list
            if (toSmallText) {
                const index = normalAlphabet.indexOf(char);
                const scriptIndex = scriptChars.indexOf(char);

                if (scriptIndex !== -1) {
                    preConvertedText += (scriptType != 2) ?
                        scriptTypeChars[scriptIndex] : char;
                } else {
                    preConvertedText += (index !== -1) ?
                        chars[index] : char;
                }
            } else { // Convert small to normal large text
                const index = chars.indexOf(char);
                const scriptIndex = scriptTypeChars.indexOf(char);

                if (scriptIndex !== -1) {
                    preConvertedText += scriptChars[scriptIndex];
                } else {
                    preConvertedText += (index !== -1) ? 
                        normalAlphabet[index] : char;
                }
            }
        }

        (toSmallText) ? outputText = preConvertedText : inputText = preConvertedText;
    }

    // todo maybe include ‘’“” somehow 
    // todo merge the css into stylesheet
</script>

<style>
    .selector {
        border-left: 5px solid white;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 10px;
    }

    .selector::before {
        content: "";
        border-top: 5px solid var(--lightest3);
        width: 23px;
        right: 20px;
        bottom: 20px;
        display: block;
        position: relative;
    }

    .selector::after {
        content: "";
        border-bottom: 5px solid var(--lightest3);
        width: 23px;
        right: 20px;
        display: block;
        position: relative;
        top: 20px;
    }

    textarea {
        width: 50%;
        height: 300px;
        margin: 0;
    }

    .inputs {
        display: flex;
        justify-content: center;
        gap: 10px;
        align-items: center;
    }

    input#scriptType {
        width: 100%;
        height: 0.6rem;
    }
        
    /* Modify the appearance of the slider */
    .seek_slider {
        appearance: none;
        height: 5px;
        opacity: 0.7;
        border-radius: 5px;
    }

    .slider_container { width: 60px; }
    
    /* Modify the appearance of the slider thumb */
    .seek_slider::-webkit-slider-thumb {
        appearance: none;
        width: 15px;
        height: 15px;
        background: var(--blue2);
        cursor: pointer;
        border-radius: 50%;
    }
    
    .seek_slider:hover { opacity: 1.0; }
    .seek_slider { width: 20%; }

    input::-webkit-slider-thumb, .seek_slider {
	    transform: scale(1);
	    transition: transform .3s cubic-bezier(0, 0.6, 0, 1), box-shadow .3s cubic-bezier(0, 0.6, 0, 1);
        box-shadow: var(--darkest1) 0px 0px 20px 10px;
    }

    input:hover::-webkit-slider-thumb {
        transform: scale(1.5);
        box-shadow: var(--darkest1) 0px 0px 20px 10px;
    }
</style>

<h1>Small Text Converter</h1>

<div class="selector">
    <h5 style="position: absolute; margin-top: -2rem; margin-left: 0.65rem;">OPTIONS</h5>
    <div style="height: 0.5rem;"></div>
    <label class="container">
        <input type="checkbox" id="useDifferentText" bind:checked={textType} onchange={convertText}>
        <span class="checkmark"></span>
        <Tooltip inlineText="Use alternate text style">
            Use a slightly different text charset
            <div style="height: 0.5rem;"></div>
            <img src="/media/tools/textconverter/texttypepreview.png" alt="Shows difference between the text type function" class="noImgStyle" style="border-radius: 5px">
        </Tooltip>
    </label>

    <br><br>
    <div style="display: flex; gap: 5px">
        <Tooltip inlineText="Subscript" click={() => scriptType = 1}>
            Shown below the text
            <div style="height: 0.5rem;"></div>
            <img src="/media/tools/textconverter/subtext-demo.png" alt="Subscript text demo" class="noImgStyle" style="border-radius: 5px">
        </Tooltip>

        <!-- Slider -->
        <div class="slider_container" style="margin-left: 7px">
            <input type="range" class="seek_slider" min="1" bind:value={scriptType} max="3" oninput={convertText} id="scriptType">
        </div>

        <Tooltip inlineText="Superscript" click={() => scriptType = 3}>
            Shown above the text
            <div style="height: 0.5rem;"></div>
            <img src="/media/tools/textconverter/supertext-demo.png" alt="Superscript text demo" class="noImgStyle" style="border-radius: 5px">
        </Tooltip>
    </div>
</div>

<br>

<div class="inputs">
    <textarea bind:value={inputText} oninput={convertText} placeholder="Normal text"></textarea>
    <p>➡️</p>
    <textarea bind:value={outputText} oninput={() => convertText(false)} placeholder="Small text"></textarea>
</div>