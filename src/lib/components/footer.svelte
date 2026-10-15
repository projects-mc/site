<script>
	import { resolve } from '$app/paths';
</script>

<footer>
	<p>&copy;{new Date().getFullYear()}/Playboard</p>
	<p class="footerLinks">
		<a href={resolve('/privacy')}>Privacy Policy</a>
		<span aria-hidden="true">&bull;</span>
		<a href={resolve('/terms')}>Terms of Use</a>
	</p>
</footer>
