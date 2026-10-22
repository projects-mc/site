// A preview of a server's description (its motd) as the lobby's game picker shows it. madrone's Motd class is the real
// thing; this mirrors it closely enough to write one: the same tags (formatting only), the same 10 lines of 30
// characters, a sprite or head counting as one character. Tags it doesn't know stay as text, like in the game.

export const LINES = 10;
export const WIDTH = 30;

export const COLORS = {
	black: '#000000', dark_blue: '#0000aa', dark_green: '#00aa00', dark_aqua: '#00aaaa', dark_red: '#aa0000',
	dark_purple: '#aa00aa', gold: '#ffaa00', gray: '#aaaaaa', dark_gray: '#555555', blue: '#5555ff', green: '#55ff55',
	aqua: '#55ffff', red: '#ff5555', light_purple: '#ff55ff', yellow: '#ffff55', white: '#ffffff'
};
const ALIASES = { grey: 'gray', dark_grey: 'dark_gray' };
const DECORATIONS = {
	bold: 'bold', b: 'bold', italic: 'italic', i: 'italic', em: 'italic', underlined: 'underlined', u: 'underlined',
	strikethrough: 'strikethrough', st: 'strikethrough', obfuscated: 'obfuscated', obf: 'obfuscated'
};

const color = (name) => {
	const key = ALIASES[name?.toLowerCase()] ?? name?.toLowerCase();
	if (COLORS[key]) return COLORS[key];
	return /^#[0-9a-f]{6}$/i.test(name ?? '') ? name.toLowerCase() : null;
};

// What a tag does to the style, or null if it isn't a tag the game accepts here
function apply(tag, style) {
	const [name, ...args] = tag.split(':');
	const lower = name.toLowerCase();
	const asColor = color(name);
	if (asColor) return { ...style, color: asColor };
	if ((lower === 'color' || lower === 'colour' || lower === 'c') && color(args[0])) return { ...style, color: color(args[0]) };
	if (DECORATIONS[lower]) return { ...style, [DECORATIONS[lower]]: args[0] !== 'false' };
	// Gradients and transitions are shown in their first color, rainbows in red
	if (lower === 'gradient' || lower === 'transition') return { ...style, color: color(args[0]) ?? '#ffffff' };
	if (lower === 'rainbow' || lower === 'pride') return { ...style, color: COLORS.red };
	if (lower === 'shadow') return style;
	return null;
}

// Splits the source into tokens: text, and <tags> (not escaped with a backslash)
function tokens(source) {
	const out = [];
	let text = '';
	for (let i = 0; i < source.length; i++) {
		if (source[i] === '\\' && (source[i + 1] === '<' || source[i + 1] === '\\')) {
			text += source[++i];
			continue;
		}
		if (source[i] === '<') {
			const end = source.indexOf('>', i);
			if (end > i + 1) {
				if (text) out.push({ text });
				text = '';
				out.push({ tag: source.slice(i + 1, end), raw: source.slice(i, end + 1) });
				i = end;
				continue;
			}
		}
		text += source[i];
	}
	if (text) out.push({ text });
	return out;
}

// [{ segments: [{ text, style } | { sprite, style }], width }] after clipping, plus whether anything was cut
export function preview(source) {
	const lines = [{ segments: [], width: 0 }];
	let clipped = false;
	let stack = [{ name: '', style: {} }];
	const style = () => stack.at(-1).style;
	const line = () => lines.at(-1);
	const newLine = () => {
		if (lines.length >= LINES) clipped = true;
		lines.push({ segments: [], width: 0 });
	};
	const add = (piece, width) => {
		if (lines.length > LINES) return;
		if (line().width + width > WIDTH) {
			clipped = true;
			return;
		}
		line().segments.push({ ...piece, style: style() });
		line().width += width;
	};
	const addText = (text) => {
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
		else if (lower === 'reset') stack = [stack[0]];
		else if (lower.startsWith('head:')) add({ sprite: tag.slice(5), head: headId(tag.slice(5)) }, 1);
		else if (lower.startsWith('sprite:')) add({ sprite: tag.slice(tag.indexOf(':') + 1) }, 1);
		else if (tag.startsWith('/')) {
			const name = tag.slice(1).split(':')[0].toLowerCase();
			// </> closes the innermost tag
			const at = name ? stack.findLastIndex((entry) => entry.name === name) : stack.length - 1;
			if (at > 0) stack = stack.slice(0, at);
			else addText(token.raw);
		} else {
			const next = apply(tag, style());
			if (next) stack.push({ name: lower.split(':')[0], style: next });
			else addText(token.raw);
		}
	}
	if (lines.length > LINES) lines.length = LINES;
	while (lines.length > 1 && lines.at(-1).segments.length === 0) lines.pop();
	// Merge neighbours with the same style back into runs
	for (const l of lines) {
		const merged = [];
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
export function headId(arg) {
	const value = arg.split(':')[0].replace(/^["']|["']$/g, '');
	if (value.length <= 36) return value;
	try {
		const url = JSON.parse(atob(value)).textures.SKIN.url;
		return url.slice(url.lastIndexOf('/') + 1);
	} catch {
		return null;
	}
}
export const headImage = (id) => `https://mc-heads.net/avatar/${encodeURIComponent(id)}/8`;

// Whole <head:...> tags: the editor shows each as just the face. Not one escaped with a backslash (\<head:...>),
// which the game shows as text; an escaped backslash before it (\\<head:...>) doesn't count
export const HEAD_TAG = /(?<=(?:^|[^\\])(?:\\\\)*)<head:[^<>]+>/gi;

// The editor shows one line per row; the file keeps them on one line with <br> between
export const toRows = (motd) => (motd ?? '').split(/<br>|<newline>/i).join('\n');
export const fromRows = (rows) => rows.replace(/\r/g, '').split('\n').join('<br>').replace(/(<br>)+$/, '');
