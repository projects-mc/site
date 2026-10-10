<script>
	import Admonition from '#lib/components/admonition.svelte';
	import Title from '#lib/components/title.svelte';
	const attributes = (repo) => [repo.forks_count, repo.stargazers_count, repo.watchers_count]
	const attributeIcons =       ['git-fork',       'star',                'eye'];
	const icon = (isFork) => 
		(isFork) ? "git-fork.svg" : "github.svg"

	let { data } = $props(); // Necessary for the Github repo system to work
</script>
<style>
	/* Github cards */
	.githubCard {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: space-evenly;
	}

	.githubCard div {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.githubCard h4 {
		position: relative;
		top: 2px;
	}
	h3 { text-transform: capitalize; }
</style>

<Title name="GitHub Repos"/>

<div class="gridLayout">
{#if data.noConnection}
	<Admonition error>Could not connect to the GitHub API! Repositories cannot be shown.</Admonition>
{:else}
	{#each data.repos as { ...repo }}
		<a href={repo.homepage || repo.html_url}>
			<div class="coverCard innerCard" style="--bg: url(/media/icons/{icon(repo.fork)}); --size: 10rem;">
				<h3>{repo.name.replaceAll("-", " ")}</h3>
				{#if repo.archived}<h5>📦️ ARCHIVED</h5>{/if}
			
				<p>{repo.description || ""}</p>
			
				<div class="githubCard">
				{#each attributes(repo) as item, index}
					<div>
						<img src="/media/icons/{attributeIcons[index]}.svg" alt="Git icon" class="noImgStyle"/>
						<h4>{item || "0"}</h4>
					</div>
				{/each}
				</div>
			</div>
		</a>
	{/each}
{/if}
</div>

<a class="showMoreBtn" href="https://github.com/AmazinAxel" target="_blank" style="margin-top: 1rem">View Github profile</a>
