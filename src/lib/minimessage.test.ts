import { describe, it, expect } from 'vitest';
import { preview, toRows, fromRows, headId, HEAD_TAG, LINES, WIDTH, COLORS, type Line } from '#lib/minimessage.ts';
import { at } from '../test-util.ts';

const plain = (result: { lines: Line[] }) => result.lines.map((l) => l.segments.map((s) => s.text ?? '■').join(''));
const first = (source: string) => at(preview(source).lines);

describe('motd preview', () => {
	it('styles text', () => {
		const { lines, clipped } = preview('<red>Bed <bold>wars</bold>!');
		expect(clipped).toBe(false);
		expect(at(lines).segments).toEqual([
			{ text: 'Bed ', style: { color: COLORS.red } },
			{ text: 'wars', style: { color: COLORS.red, bold: true } },
			{ text: '!', style: { color: COLORS.red } }
		]);
		expect(first('<#12AB34>x<reset>y').segments.map((s) => s.style)).toEqual([{ color: '#12ab34' }, {}]);
		expect(at(first('<color:gold>x</color>').segments).style).toEqual({ color: COLORS.gold });
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
		expect(at(at(result.lines).segments).sprite).toBe('item/diamond');
		expect(at(result.lines).width).toBe(WIDTH);
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

describe('heads', () => {
	const texture = btoa(JSON.stringify({ textures: { SKIN: { url: 'http://textures.minecraft.net/texture/e70dcd95' } } }));

	it('finds whose face a head shows', () => {
		expect(headId('Notch')).toBe('Notch');
		expect(headId(`"${texture}"`)).toBe('e70dcd95');
		expect(headId(texture)).toBe('e70dcd95');
		expect(headId('x'.repeat(40))).toBe(null);
		expect(at(first(`<red><head:"${texture}">`).segments).head).toBe('e70dcd95');
	});

	it('matches whole head tags only', () => {
		expect(`a<head:Notch>b<head:"${texture}"><head:x`.match(HEAD_TAG)).toEqual(['<head:Notch>', `<head:"${texture}">`]);
		expect('\\<head:Notch>'.match(HEAD_TAG)).toBe(null);
		expect('\\\\<head:Notch>'.match(HEAD_TAG)).toEqual(['<head:Notch>']);
		expect(first('\\<head:Notch>').segments).toEqual([{ text: '<head:Notch>', style: {} }]);
	});
});
