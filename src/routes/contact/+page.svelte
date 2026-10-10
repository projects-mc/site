<script>
	import Admonition from '#lib/components/admonition.svelte';
	import Title from '#lib/components/title.svelte';
	import { fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
	import { Turnstile } from 'svelte-turnstile';

	const transition = { y: -5, duration: 500, easing: cubicOut };

	let buttonText = $state('Send Message');
	let showError = $state(false);
	let errorMessage = $state('');
	async function handleSubmit( event ) {
		event.preventDefault();
		buttonText = 'Sending Message...'; // Show confirmation text

		if (showError == true) { // Hide error on submit
			showError = false;
			setTimeout(() => { error = ""; }, 400); // Completely remove the error element
		}

		const data = new FormData(event.target); // Create formData to send
		const xhr = new XMLHttpRequest(); // Create HTTP request
		xhr.open('POST', 'https://journal.amazinaxel.com/contact-form'); // Open the HTTP request
		console.log("Sending message....");
		
		xhr.onload = () => { // Get the response
			if (xhr.status == 200) { buttonText = 'Message Sent!'; window.turnstile.reset(); } // Success!
			else { // There was an error, show a helpful error message
				buttonText = 'Resubmit'; // Show error confirmation on button
				errorMessage = `<p>${xhr.responseText}</p>`; // Create error message
				showError = true // Insert error message
				window.turnstile.reset(); // Reset Turnstile captcha
			};
		};
		xhr.send(data); // Send off the form data
	}
</script>

<Title name="Contact"/>

<Admonition info>
	<p><strong><a href="https://discord.com/">Discord</a> is my preferred communication platform.</strong> Reach out to me under my Discord handle: <code>@amazinaxel</code></p>
	<p>If you cannot use Discord for any reason, use the below contact form. Include a contact method if you would like a response.</p>
</Admonition>

<!-- https://kit.svelte.dev/docs/form-actions -->
<div class="innerCard coverCard" style="--bg: url(/media/icons/contact.svg); --size: 20rem;">
	<h2>Get in touch</h2>
    <form method="POST" onsubmit={handleSubmit}>
        <label for="subject">Subject:</label> <input type="text" name="title" placeholder="Message Subject"/>
		<div></div>
		<label for="name">Name:</label> <input type="text" name="name" placeholder="Your Name"/>
		<div></div>
		<label for="message" class="heavy">Message:</label> <textarea name="message" style="width: 300px; height: 150px;" type="text" placeholder="Enter your message here"></textarea>

		<div style="padding: 0.5rem"></div>
		<Turnstile siteKey="0x4AAAAAAAEGFTl2ESubJ-n9" theme="dark"/>

		{#if showError}
			<div in:fly|local={transition} out:fly|local={transition}>
				<Admonition error>{@html errorMessage}</Admonition>
			</div>
			<br>
		{/if}
		
        <button type="submit" class="button">{ buttonText }</button>
    </form>
	<br>
	<sub>This form is protected by <a href="https://www.cloudflare.com/products/turnstile/">Cloudflare Turnstile</a> - read <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a></sub>
</div>