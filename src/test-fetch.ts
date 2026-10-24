// A fake fetch for unit tests: answers what the test says, and remembers what was asked
import { vi, type Mock } from 'vitest';

export interface Init {
	method: string;
	headers: Record<string, string>;
	body?: string;
}

export type FetchMock = Mock<(url: string, init: Init) => Promise<Response>>;

export const reply = (status: number, body?: unknown) =>
	new Response(body === undefined ? null : JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});

// A new fake fetch in place of the real one
export function stubFetch(): FetchMock {
	const fetch: FetchMock = vi.fn();
	vi.stubGlobal('fetch', fetch);
	return fetch;
}

// The nth request made
export function call(fetch: FetchMock, n: number): Init & { url: string } {
	const made = fetch.mock.calls[n];
	if (!made) throw new Error(`no request number ${n}`);
	return { url: made[0], ...made[1] };
}
