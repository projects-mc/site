<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import { currentInstance } from '#lib/session.svelte.ts';
	import { api } from '#lib/api.ts';
	import type { FileEntry } from '#lib/types.ts';
	import type * as Monaco from 'monaco-editor';

	// A VS Code style editor: the instance's files on the left, open files as tabs, Monaco for the editing.
	// Files bigger than this, or that look binary, are downloaded instead of opened
	const MAX_EDIT_BYTES = 1 << 20;
	const BINARY_FILE = /\.(jar|zip|gz|tar|png|jpg|jpeg|gif|webp|ogg|mp3|wav|mca|mcr|dat|dat_old|db|sqlite|class|nbt|schem|schematic)$/i;

	let name = $derived(currentInstance()?.name ?? '');
	let folders: Record<string, FileEntry[]> = $state({}); // folder path -> its entries, once loaded ('' is the top)
	let expanded: Record<string, boolean> = $state({}); // folder path -> shown open in the tree
	let tabs: { path: string; isDirty: boolean }[] = $state([]);
	let activePath = $state('');
	let targetFolder = $state(''); // where New file / New folder go: the folder last clicked, or the open file's
	let error = $state('');

	let monaco: typeof Monaco | undefined;
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let host: HTMLElement;
	// path -> { model, savedVersion }; Monaco owns the models, nothing renders from this map
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const models = new Map<string, { model: Monaco.editor.ITextModel; savedVersion: number }>();
	const join = (...parts: string[]) => parts.filter(Boolean).join('/');
	const parentOf = (path: string) => path.split('/').slice(0, -1).join('/');
	const baseName = (path: string) => path.split('/').pop() ?? path;
	let isDirty = $derived(tabs.some((tab) => tab.isDirty));
	const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

	onMount(() => {
		let isGone = false;
		void (async () => {
			const loaded = (await import('#lib/monaco.ts')).monaco;
			monaco = loaded;
			// Monaco measures the font when it starts, so wait for Monocraft first
			await document.fonts.load('18px Monocraft');
			if (isGone) return;
			editor = loaded.editor.create(host, {
				theme: 'playboard',
				fontFamily: 'Monocraft',
				fontSize: 18,
				lineHeight: 27,
				fontLigatures: false,
				automaticLayout: true,
				minimap: { enabled: false },
				insertSpaces: false, // Skript is indented with tabs
				tabSize: 4,
				detectIndentation: true,
				renderWhitespace: 'boundary',
				scrollBeyondLastLine: false,
				model: null
			});
			editor.addCommand(loaded.KeyMod.CtrlCmd | loaded.KeyCode.KeyS, () => void save());
			if (activePath) show(activePath);
		})();
		return () => {
			isGone = true;
			editor?.dispose();
			disposeModels();
		};
	});

	// A different instance starts over: nothing open, the top folder listed
	$effect(() => {
		const instance = name;
		if (!instance) return;
		disposeModels();
		tabs = [];
		activePath = '';
		folders = {};
		expanded = {};
		targetFolder = '';
		void load('');
	});

	function disposeModels() {
		for (const { model } of models.values()) model.dispose();
		models.clear();
		editor?.setModel(null);
	}

	async function load(path: string) {
		const instance = name;
		try {
			const list = await api.files(instance, path);
			if (instance !== name) return;
			list.sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name));
			folders[path] = list;
			error = '';
		} catch (e) {
			error = message(e);
		}
	}

	function toggleFolder(path: string) {
		targetFolder = path;
		expanded[path] = !expanded[path];
		if (expanded[path] && !folders[path]) void load(path);
	}

	async function openFile(path: string, entry: Pick<FileEntry, 'name' | 'size'>) {
		targetFolder = parentOf(path);
		if (entry.size > MAX_EDIT_BYTES || BINARY_FILE.test(entry.name)) return location.assign(api.fileLink(name, path));
		if (!models.has(path)) {
			const instance = name;
			let text: string;
			try {
				text = await api.readFile(instance, path);
			} catch (e) {
				error = message(e);
				return;
			}
			if (instance !== name || models.has(path) || !monaco) return;
			const model = monaco.editor.createModel(text, undefined, monaco.Uri.file(path));
			const open = { model, savedVersion: model.getAlternativeVersionId() };
			models.set(path, open);
			// Undoing back to the saved text counts as unchanged again, like VS Code
			model.onDidChangeContent(() => {
				const tab = tabs.find((tab) => tab.path === path);
				if (tab) tab.isDirty = model.getAlternativeVersionId() !== open.savedVersion;
			});
			tabs.push({ path, isDirty: false });
		}
		show(path);
	}

	function show(path: string) {
		activePath = path;
		if (!editor) return; // Monaco is still loading; it shows this once ready
		editor.setModel(models.get(path)?.model ?? null);
		editor.focus();
	}

	function closeTab(path: string) {
		const tab = tabs.find((tab) => tab.path === path);
		if (tab?.isDirty && !confirm(`Close ${baseName(path)} without saving?`)) return;
		if (!tab) return;
		const index = tabs.indexOf(tab);
		tabs.splice(index, 1);
		models.get(path)?.model.dispose();
		models.delete(path);
		if (activePath === path) {
			const next = tabs[Math.min(index, tabs.length - 1)];
			if (next) show(next.path);
			else {
				activePath = '';
				editor?.setModel(null);
			}
		}
	}

	async function save() {
		const path = activePath;
		const open = models.get(path);
		if (!open) return;
		const version = open.model.getAlternativeVersionId();
		try {
			await api.writeFile(name, path, open.model.getValue());
			open.savedVersion = version;
			const tab = tabs.find((tab) => tab.path === path);
			if (tab) tab.isDirty = open.model.getAlternativeVersionId() !== version;
			error = '';
			void load(parentOf(path)); // sizes changed
		} catch (e) {
			error = message(e);
		}
	}

	// Whether it worked; the error is shown if not
	async function run(action: () => Promise<unknown>, folder: string): Promise<boolean> {
		try {
			await action();
			error = '';
			await load(folder);
			return true;
		} catch (e) {
			error = message(e);
			return false;
		}
	}

	function newFile() {
		const fileName = prompt(`New file in ${targetFolder || name} (e.g. game.sk):`)?.trim();
		if (!fileName) return;
		const path = join(targetFolder, fileName);
		expanded[targetFolder] = true;
		void run(() => api.writeFile(name, path, ''), targetFolder).then((made) => {
			if (made) void openFile(path, { name: fileName, size: 0 });
		});
	}

	function newFolder() {
		const folderName = prompt(`New folder in ${targetFolder || name}:`)?.trim();
		if (!folderName) return;
		expanded[targetFolder] = true;
		void run(() => api.mkdir(name, join(targetFolder, folderName)), targetFolder);
	}

	// Open tabs at or under a path that has just been renamed or deleted
	const tabsUnder = (path: string) => tabs.filter((tab) => tab.path === path || tab.path.startsWith(path + '/'));

	function rename(path: string) {
		const newName = prompt('Rename to:', baseName(path))?.trim();
		if (!newName || newName === baseName(path)) return;
		const affected = tabsUnder(path);
		if (affected.some((tab) => tab.isDirty) && !confirm('Renaming closes its open files without saving. Continue?')) return;
		for (const tab of affected) {
			tab.isDirty = false;
			closeTab(tab.path);
		}
		void run(() => api.rename(name, path, join(parentOf(path), newName)), parentOf(path));
	}

	function remove(path: string, entry: FileEntry) {
		const what = entry.dir ? `the folder ${entry.name} and everything in it` : entry.name;
		if (!confirm(`Delete ${what}?`)) return;
		for (const tab of tabsUnder(path)) {
			tab.isDirty = false;
			closeTab(tab.path);
		}
		void run(() => api.deleteFile(name, path), parentOf(path));
	}

	function refresh() {
		for (const path of Object.keys(folders)) if (path === '' || expanded[path]) void load(path);
	}

	// Unsaved work survives neither leaving the page nor closing the tab without asking
	beforeNavigate((navigation) => {
		if (isDirty && !confirm('You have unsaved files. Leave anyway?')) navigation.cancel();
	});
	function onBeforeUnload(e: BeforeUnloadEvent) {
		if (isDirty) e.preventDefault();
	}
</script>

<svelte:window onbeforeunload={onBeforeUnload}/>
<svelte:head>
	<title>Code - Playboard</title>
	<link rel="stylesheet" href="/css/code.css"/>
</svelte:head>

{#snippet tree(folder: string, depth: number)}
	{#each folders[folder] ?? [] as entry (entry.name)}
		{@const path = join(folder, entry.name)}
		<li>
			<div class="codeRow" class:active={path === activePath} style="--depth: {depth}">
				<button
					class="codeEntry"
					onclick={() => (entry.dir ? toggleFolder(path) : openFile(path, entry))}
					aria-expanded={entry.dir ? !!expanded[path] : undefined}
				>
					<span class="codeTwisty" aria-hidden="true">{entry.dir ? (expanded[path] ? 'v' : '>') : ''}</span>
					{entry.name}
				</button>
				<button class="codeRowAction" onclick={() => rename(path)} title="Rename" aria-label="Rename {entry.name}">R</button>
				<button class="codeRowAction" onclick={() => remove(path, entry)} title="Delete" aria-label="Delete {entry.name}">&times;</button>
			</div>
			{#if entry.dir && expanded[path]}
				<ul>{@render tree(path, depth + 1)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<div class="codeWorkbench pixelBox">
	<aside class="codeExplorer">
		<header class="codeExplorerHeader">
			<span class="codeTitle">{name}</span>
			<button class="codeRowAction" onclick={newFile} title="New file" aria-label="New file">+F</button>
			<button class="codeRowAction" onclick={newFolder} title="New folder" aria-label="New folder">+D</button>
			<button class="codeRowAction" onclick={refresh} title="Refresh" aria-label="Refresh">&#8635;</button>
		</header>
		<ul class="codeTree">{@render tree('', 0)}</ul>
	</aside>

	<section class="codeMain">
		<div class="codeTabs" role="tablist">
			{#each tabs as tab (tab.path)}
				<div class="codeTab" class:active={tab.path === activePath} title={tab.path}>
					<button role="tab" aria-selected={tab.path === activePath} onclick={() => show(tab.path)}>
						{baseName(tab.path)}
					</button>
					<button class="codeTabClose" onclick={() => closeTab(tab.path)} aria-label="Close {baseName(tab.path)}">
						{tab.isDirty ? '●' : '×'}
					</button>
				</div>
			{/each}
		</div>
		<div class="codeEditorArea">
			<div class="codeEditor" bind:this={host}></div>
			{#if !activePath}
				<p class="codeEmpty">Open a file on the left. Scripts live in <code>Skript/scripts</code>; save with Ctrl+S, then run <code>skript reload all</code> in the console.</p>
			{/if}
		</div>
		{#if error}<p class="codeError">{error}</p>{/if}
	</section>
</div>
