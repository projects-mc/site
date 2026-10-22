import { describe, it, expect } from 'vitest';
import { preview, toRows, fromRows, LINES, WIDTH, COLORS } from '#lib/minimessage';

const plain = (result) => result.lines.map((l) => l.segments.map((s) => s.text ?? '■').join(''));

describe('motd preview', () => {
	it('styles text', () => {
		const { lines, clipped } = preview('<red>Bed <bold>wars</bold>!');
		expect(clipped).toBe(false);
		expect(lines[0].segments).toEqual([
			{ text: 'Bed ', style: { color: COLORS.red } },
			{ text: 'wars', style: { color: COLORS.red, bold: true } },
			{ text: '!', style: { color: COLORS.red } }
		]);
		expect(preview('<#12AB34>x<reset>y').lines[0].segments.map((s) => s.style)).toEqual([{ color: '#12ab34' }, {}]);
		expect(preview('<color:gold>x</color>').lines[0].segments[0].style).toEqual({ color: COLORS.gold });
	});

	it('clips to the lines and width the game shows', () => {
		const result = preview(Array(12).fill('x'.repeat(40)).join('<br>'));
		expect(result.clipped).toBe(true);
		expect(result.lines).toHaveLength(LINES);
		expect(plain(result).every((l) => l.length === WIDTH)).toBe(true);
		expect(plain(preview('a<newline>b<br><br>'))).toEqual(['a', 'b']);
	});

	it('counts sprites as one character', () => {
		const result = preview('<sprite:item/diamond>' + 'z'.repeat(40));
		expect(result.lines[0].segments[0].sprite).toBe('item/diamond');
		expect(result.lines[0].width).toBe(WIDTH);
	});

	it('keeps tags the game ignores as text', () => {
		expect(plain(preview('<click:run_command:/x>hi'))).toEqual(['<click:run_command:/x>hi']);
		expect(plain(preview('\\<red>x</nope>'))).toEqual(['<red>x</nope>']);
	});

	it('converts between the editor and the file', () => {
		expect(toRows('a<br>b<newline>c')).toBe('a\nb\nc');
		expect(fromRows('a\r\nb\n\n')).toBe('a<br>b');
		expect(toRows(undefined)).toBe('');
	});
});
