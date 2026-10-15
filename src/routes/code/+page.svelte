<script>
	import InstanceHeader from '#lib/components/instanceHeader.svelte';
	import { currentInstance } from '#lib/session.svelte.js';
	import { api } from '#lib/api';
	import { formatBytes } from '#lib/format';

	// Files bigger than this, or that aren't text, are downloaded instead of opened
	const MAX_EDIT_BYTES = 1 << 20;
	const TEXT_FILE = /\.(sk|txt|properties|yml|yaml|json|md|csv|lang|toml|cfg|conf|log)$/i;

	let name = $derived(currentInstance()?.name);
	let folder = $state('');
	let entries = $state([]);
	let file = $state(null); // { path, text, saved }
	let error = $state('');

	let crumbs = $derived(folder ? folder.split('/') : []);
	let changed = $derived(file && file.text !== file.saved);
	const join = (...parts) => parts.filter(Boolean).join('/');

	// A different instance starts at its top folder with nothing open
	$effect(() => {
		name;
		file = null;
		openFolder('');
	});

	async function openFolder(path) {
		if (changed && !confirm('Discard your unsaved changes?')) return;
		const instance = name;
		try {
			const list = await api.files(instance, path);
			if (instance !== name) return;
			folder = path;
			entries = list;
			error = '';
		} catch (e) {
			error = e.message;
		}
	}

	async function openFile(entry) {
		const path = join(folder, entry.name);
		if (entry.size > MAX_EDIT_BYTES || !TEXT_FILE.test(entry.name)) return location.assign(api.fileLink(name, path));
		if (changed && !confirm('Discard your unsaved changes?')) return;
		try {
			const text = await api.readFile(name, path);
			file = { path, text, saved: text };
			error = '';
		} catch (e) {
			error = e.message;
		}
	}

	async function run(action, done) {
		try {
			await action();
			error = '';
			done?.();
			await openFolder(folder);
		} catch (e) {
			error = e.message;
		}
	}

	const save = () => run(() => api.writeFile(name, file.path, file.text), () => (file.saved = file.text));

	// Skript is indented with tabs, so Tab types one instead of leaving the editor
	function onEditorKeydown(e) {
		if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) return;
		e.preventDefault();
		const area = e.currentTarget;
		area.setRangeText('\t', area.selectionStart, area.selectionEnd, 'end');
		file.text = area.value;
	}

	function onKeydown(e) {
		if ((e.ctrlKey || e.metaKey) && e.key === 's' && file) {
			e.preventDefault();
			save();
		}
	}

	function newFile() {
		const fileName = prompt('New file name (e.g. game.sk):')?.trim();
		if (fileName) run(() => api.writeFile(name, join(folder, fileName), ''));
	}

	function newFolder() {
		const folderName = prompt('New folder name:')?.trim();
		if (folderName) run(() => api.mkdir(name, join(folder, folderName)));
	}

	function rename(entry) {
		const newName = prompt('Rename to:', entry.name)?.trim();
		if (newName && newName !== entry.name)
			run(() => api.rename(name, join(folder, entry.name), join(folder, newName)), () => (file = null));
	}

	function remove(entry) {
		const what = entry.dir ? `the folder ${entry.name} and everything in it` : entry.name;
		if (confirm(`Delete ${what}?`)) run(() => api.deleteFile(name, join(folder, entry.name)), () => (file = null));
	}
</script>

<svelte:window onkeydown={onKeydown}/>
<svelte:head>
	<link rel="stylesheet" href="/css/code.css"/>
</svelte:head>

<InstanceHeader page="Code"/>
<p>Scripts live in <code>Skript/scripts</code>. After saving, run <code>skript reload all</code> in the console or restart.</p>
{#if error}<p class="codeError">{error}</p>{/if}

<div class="code">
	<section class="codeFiles pixelBox">
		<nav class="codePath" aria-label="Folder">
			<button onclick={() => openFolder('')}>{name}</button>
			{#each crumbs as crumb, i (i)}
				/<button onclick={() => openFolder(crumbs.slice(0, i + 1).join('/'))}>{crumb}</button>
			{/each}
		</nav>
		<div class="codeActions">
			<button onclick={newFile}>New file</button>
			<button onclick={newFolder}>New folder</button>
		</div>
		<ul>
			{#if folder}
				<li><button class="codeEntry" onclick={() => openFolder(crumbs.slice(0, -1).join('/'))}>..</button></li>
			{/if}
			{#each entries as entry (entry.name)}
				<li class:open={file?.path === join(folder, entry.name)}>
					<button class="codeEntry" onclick={() => (entry.dir ? openFolder(join(folder, entry.name)) : openFile(entry))}>
						{entry.name}{entry.dir ? '/' : ''}
					</button>
					<span class="codeSize">{entry.dir ? '' : formatBytes(entry.size)}</span>
					<button onclick={() => rename(entry)} aria-label="Rename {entry.name}">Rename</button>
					<button onclick={() => remove(entry)} aria-label="Delete {entry.name}">&times;</button>
				</li>
			{/each}
		</ul>
	</section>

	{#if file}
		<section class="codeEditor pixelBox">
			<header>
				<span>{file.path}{changed ? ' *' : ''}</span>
				<button onclick={save} disabled={!changed}>Save</button>
			</header>
			<textarea bind:value={file.text} onkeydown={onEditorKeydown} spellcheck="false" aria-label="Contents of {file.path}"></textarea>
		</section>
	{/if}
</div>
