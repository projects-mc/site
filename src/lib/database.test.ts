import { describe, it, expect } from 'vitest';
import {
	enter,
	crumbs,
	scriptName,
	show,
	editType,
	validKey,
	validName,
} from '#lib/database.ts';

describe('database browsing', () => {
	it('walks levels and back', () => {
		const level = enter(enter('', 'coins'), 'alice');
		expect(level).toBe('coins::alice::');
		expect(crumbs(level)).toEqual([
			{ name: 'coins', prefix: 'coins::' },
			{ name: 'alice', prefix: 'coins::alice::' },
		]);
		expect(crumbs('')).toEqual([]);
		expect(scriptName('stats', 'coins::alice')).toBe('{stats::coins::alice}');
	});

	it('shows simple values as they are and others by type', () => {
		expect(show({ type: 'string', size: 4, value: 'hi' })).toBe('"hi"');
		expect(show({ type: 'long', size: 8, value: 5 })).toBe('5');
		expect(show({ type: 'boolean', size: 1, value: false })).toBe('false');
		expect(show({ type: 'location', size: 52 })).toBe('location (52 bytes)');
		expect(show(undefined)).toBe('');
		expect(editType({ type: 'double', size: 8, value: 1.5 })).toBe('number');
		expect(editType({ type: 'boolean', size: 1, value: true })).toBe('boolean');
		expect(editType({ type: 'string', size: 0, value: '' })).toBe('string');
		expect(editType({ type: 'location', size: 3 })).toBeNull();
	});

	it('checks names like Skript and aspen', () => {
		expect(validKey('coins::alice')).toBe(true);
		for (const bad of ['', 'a::', '::a', 'a::::b', 'a::*'])
			expect(validKey(bad), bad).toBe(false);
		for (const good of ['stats', 'My Stats', 'économie', 'n'.repeat(32)])
			expect(validName(good), good).toBe(true);
		for (const bad of [
			'',
			'n'.repeat(33),
			'a/b',
			'a:b',
			'{a}',
			'a*',
			'"a"',
			'_x',
			'-x',
			'.x',
			' x',
			'x ',
			'a\tb',
		])
			expect(validName(bad), bad).toBe(false);
	});
});
