// A preview of a server's description (its motd) as the lobby's game picker shows it. madrone's Motd class is the real
// thing; this mirrors it closely enough to write one: the same tags (formatting only), the same 10 lines of 30
// characters, a sprite or head counting as one character. Tags it doesn't know stay as text, like in the game.

export const LINES = 10;
export const WIDTH = 30;

export interface Style {
	color?: string;
	bold?: boolean;
	italic?: boolean;
	underlined?: boolean;
	strikethrough?: boolean;
	obfuscated?: boolean;
}

// A piece of a line: a character run, or a sprite (an item's icon, or a player's face for <head:...>)
export type Segment =
	| { text: string; style: Style; sprite?: undefined; head?: undefined }
	| { sprite: string; head?: string | null; style: Style; text?: undefined };

export interface Line {
	segments: Segment[];
	width: number;
}

export const COLORS: Record<string, string> = {
	black: '#000000', dark_blue: '#0000aa', dark_green: '#00aa00', dark_aqua: '#00aaaa', dark_red: '#aa0000',
	dark_purple: '#aa00aa', gold: '#ffaa00', gray: '#aaaaaa', dark_gray: '#555555', blue: '#5555ff', green: '#55ff55',
	aqua: '#55ffff', red: '#ff5555', light_purple: '#ff55ff', yellow: '#ffff55', white: '#ffffff'
};
const ALIASES: Record<string, string> = { grey: 'gray', dark_grey: 'dark_gray' };
type Decoration = 'bold' | 'italic' | 'underlined' | 'strikethrough' | 'obfuscated';
const DECORATIONS: Record<string, Decoration> = {
	bold: 'bold', b: 'bold', italic: 'italic', i: 'italic', em: 'italic', underlined: 'underlined', u: 'underlined',
	strikethrough: 'strikethrough', st: 'strikethrough', obfuscated: 'obfuscated', obf: 'obfuscated'
};

const color = (name: string | undefined): string | null => {
	if (name === undefined) return null;
	const lower = name.toLowerCase();
	const known = COLORS[ALIASES[lower] ?? lower];
	if (known) return known;
	return /^#[0-9a-f]{6}$/i.test(name) ? lower : null;
};

// What a tag does to the style, or null if it isn't a tag the game accepts here
function apply(tag: string, style: Style): Style | null {
	const [name = '', ...args] = tag.split(':');
	const lower = name.toLowerCase();
	const asColor = color(name);
	if (asColor) return { ...style, color: asColor };
	const argColor = color(args[0]);
	if ((lower === 'color' || lower === 'colour' || lower === 'c') && argColor) return { ...style, color: argColor };
	const decoration = DECORATIONS[lower];
	if (decoration) return { ...style, [decoration]: args[0] !== 'false' };
	// Gradients and transitions are shown in their first color, rainbows in red
	if (lower === 'gradient' || lower === 'transition') return { ...style, color: argColor ?? '#ffffff' };
	if (lower === 'rainbow' || lower === 'pride') return { ...style, color: COLORS.red };
	if (lower === 'shadow') return style;
	return null;
}

type Token = { text: string; tag?: undefined } | { tag: string; raw: string; text?: undefined };

// Splits the source into tokens: text, and <tags> (not escaped with a backslash)
function tokens(source: string): Token[] {
	const out: Token[] = [];
	let text = '';
	for (let i = 0; i < source.length; i++) {
		const char = source[i] ?? '';
		const next = source[i + 1];
		if (char === '\\' && (next === '<' || next === '\\')) {
			text += next;
			i++;
			continue;
		}
		if (char === '<') {
			const end = source.indexOf('>', i);
			if (end > i + 1) {
				if (text) out.push({ text });
				text = '';
				out.push({ tag: source.slice(i + 1, end), raw: source.slice(i, end + 1) });
				i = end;
				continue;
			}
		}
		text += char;
	}
	if (text) out.push({ text });
	return out;
}

// The lines after clipping, plus whether anything was cut
export function preview(source: string): { lines: Line[]; clipped: boolean } {
	const lines: Line[] = [{ segments: [], width: 0 }];
	let clipped = false;
	const base = { name: '', style: {} as Style };
	let stack = [base];
	const style = () => (stack.at(-1) ?? base).style;
	const line = () => lines[lines.length - 1] as Line;
	const newLine = () => {
		if (lines.length >= LINES) clipped = true;
		lines.push({ segments: [], width: 0 });
	};
	const add = (piece: { text: string } | { sprite: string; head?: string | null }, width: number) => {
		if (lines.length > LINES) return;
		if (line().width + width > WIDTH) {
			clipped = true;
			return;
		}
		line().segments.push({ ...piece, style: style() });
		line().width += width;
	};
	const addText = (text: string) => {
		for (const char of text) {
			if (char === '\n') newLine();
			else add({ text: char }, 1);
		}
	};

	for (const token of tokens(source)) {
		if (token.text !== undefined) {
			addText(token.text);
			continue;
		}
		const tag = token.tag;
		const lower = tag.toLowerCase();
		if (lower === 'br' || lower === 'newline') newLine();
		else if (lower === 'reset') stack = [base];
		else if (lower.startsWith('head:')) add({ sprite: tag.slice(5), head: headId(tag.slice(5)) }, 1);
		else if (lower.startsWith('sprite:')) add({ sprite: tag.slice(tag.indexOf(':') + 1) }, 1);
		else if (tag.startsWith('/')) {
			const name = (tag.slice(1).split(':')[0] ?? '').toLowerCase();
			// </> closes the innermost tag
			const at = name ? stack.findLastIndex((entry) => entry.name === name) : stack.length - 1;
			if (at > 0) stack = stack.slice(0, at);
			else addText(token.raw);
		} else {
			const next = apply(tag, style());
			if (next) stack.push({ name: lower.split(':')[0] ?? '', style: next });
			else addText(token.raw);
		}
	}
	if (lines.length > LINES) lines.length = LINES;
	while (lines.length > 1 && line().segments.length === 0) lines.pop();
	// Merge neighbours with the same style back into runs
	for (const l of lines) {
		const merged: Segment[] = [];
		for (const segment of l.segments) {
			const last = merged.at(-1);
			if (last?.text !== undefined && segment.text !== undefined && last.style === segment.style) last.text += segment.text;
			else merged.push({ ...segment });
		}
		l.segments = merged;
	}
	return { lines, clipped };
}

// Whose face a <head:...> shows: a player's name or UUID, or for a texture value (base64 JSON) its skin's hash.
// null if the texture can't be read
export function headId(arg: string): string | null {
	const value = (arg.split(':')[0] ?? '').replace(/^["']|["']$/g, '');
	if (value.length <= 36) return value;
	try {
		const texture = JSON.parse(atob(value)) as { textures?: { SKIN?: { url?: unknown } } } | null;
		const url = texture?.textures?.SKIN?.url;
		if (typeof url !== 'string') return null;
		return url.slice(url.lastIndexOf('/') + 1);
	} catch {
		return null;
	}
}
export const headImage = (id: string) => `https://mc-heads.net/avatar/${encodeURIComponent(id)}/8`;

// Whole <head:...> tags: the editor shows each as just the face. Not one escaped with a backslash (\<head:...>),
// which the game shows as text; an escaped backslash before it (\\<head:...>) doesn't count
export const HEAD_TAG = /(?<=(?:^|[^\\])(?:\\\\)*)<head:[^<>]+>/gi;

// The editor shows one line per row; the file keeps them on one line with <br> between
export const toRows = (motd: string | null | undefined) => (motd ?? '').split(/<br>|<newline>/i).join('\n');
export const fromRows = (rows: string) => rows.replace(/\r/g, '').split('\n').join('<br>').replace(/(<br>)+$/, '');
