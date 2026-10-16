// Monaco (VS Code's editor), loaded only by the Code page: it's big, and it needs a browser, so never at prerender
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';

self.MonacoEnvironment = {
	getWorker: (_, label) => (label === 'json' ? new JsonWorker() : new EditorWorker())
};

// Skript: enough highlighting to read a script at a glance, not a full grammar
monaco.languages.register({ id: 'skript', extensions: ['.sk'], aliases: ['Skript'] });
monaco.languages.setLanguageConfiguration('skript', {
	comments: { lineComment: '#' },
	brackets: [['{', '}'], ['(', ')'], ['[', ']']],
	autoClosingPairs: [
		{ open: '{', close: '}' },
		{ open: '(', close: ')' },
		{ open: '[', close: ']' },
		{ open: '"', close: '"', notIn: ['string'] },
		{ open: '%', close: '%', notIn: ['string'] }
	],
	// A line ending in a colon opens a block
	onEnterRules: [{ beforeText: /:\s*(#.*)?$/, action: { indentAction: monaco.languages.IndentAction.Indent } }]
});
monaco.languages.setMonarchTokensProvider('skript', {
	ignoreCase: true,
	keywords: [
		'on', 'command', 'function', 'options', 'variables', 'aliases', 'every', 'if', 'else', 'loop', 'while', 'set',
		'add', 'remove', 'delete', 'clear', 'reset', 'send', 'broadcast', 'message', 'give', 'teleport', 'kill', 'spawn',
		'stop', 'return', 'exit', 'continue', 'wait', 'cancel', 'event', 'trigger', 'permission', 'usage', 'description',
		'executable', 'by', 'cooldown', 'to', 'from', 'is', 'are', 'not', 'and', 'or', 'of', 'in', 'with',
		'true', 'false', 'yes', 'no', 'local', 'execute', 'make', 'player', 'console', 'all', 'players'
	],
	tokenizer: {
		root: [
			[/#.*$/, 'comment'],
			[/^\s*(on|command|function|every|options|variables|aliases)\b[^:]*:/, 'type'],
			[/"/, 'string', '@string'],
			[/\{/, 'variable', '@variable'],
			[/\d+(\.\d+)?/, 'number'],
			[/[a-z_][\w-]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }]
		],
		string: [
			[/""/, 'string.escape'],
			[/%[^%"]*%/, 'variable'],
			[/[^"%]+/, 'string'],
			[/"/, 'string', '@pop']
		],
		variable: [
			[/%[^%}]*%/, 'variable.predefined'],
			[/[^}%]+/, 'variable'],
			[/\}/, 'variable', '@pop']
		]
	}
});

// The site's Nord colours
monaco.editor.defineTheme('playboard', {
	base: 'vs-dark',
	inherit: true,
	rules: [
		{ token: 'comment', foreground: '616e88' },
		{ token: 'keyword', foreground: '81a1c1' },
		{ token: 'type', foreground: '88c0d0' },
		{ token: 'string', foreground: 'a3be8c' },
		{ token: 'string.escape', foreground: 'ebcb8b' },
		{ token: 'number', foreground: 'b48ead' },
		{ token: 'variable', foreground: 'd08770' },
		{ token: 'variable.predefined', foreground: 'ebcb8b' }
	],
	colors: {
		'editor.background': '#2e3440',
		'editor.foreground': '#d8dee9',
		'editor.lineHighlightBackground': '#3b4252',
		'editor.selectionBackground': '#434c5e',
		'editorLineNumber.foreground': '#4c566a',
		'editorLineNumber.activeForeground': '#d8dee9',
		'editorCursor.foreground': '#d8dee9',
		'editorIndentGuide.background1': '#3b4252',
		'editorWidget.background': '#3b4252',
		'editorWidget.border': '#4c566a',
		'input.background': '#2e3440',
		'scrollbarSlider.background': '#4c566a88',
		'scrollbarSlider.hoverBackground': '#4c566aaa',
		'scrollbarSlider.activeBackground': '#4c566a'
	}
});

export { monaco };
