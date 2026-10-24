// The browser APIs the dashboard's modules use, faked for unit tests running in Node
import { beforeEach } from 'vitest';

class MemoryStorage implements Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'> {
	#items = new Map<string, string>();
	getItem = (key: string) => this.#items.get(key) ?? null;
	setItem = (key: string, value: string) => {
		this.#items.set(key, value);
	};
	removeItem = (key: string) => {
		this.#items.delete(key);
	};
	clear = () => this.#items.clear();
}

// Records every socket opened; tests drive them with receive() and close()
export class FakeSocket {
	static opened: FakeSocket[] = [];
	url: string;
	sent: string[] = [];
	closed = false;
	onmessage?: (event: { data: string }) => void;
	onclose?: (event: object) => void;

	constructor(url: string) {
		this.url = url;
		FakeSocket.opened.push(this);
	}
	send(data: string) {
		this.sent.push(data);
	}
	receive(data: unknown) {
		this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
	}
	close() {
		if (this.closed) return;
		this.closed = true;
		this.onclose?.({});
	}
}

globalThis.localStorage = new MemoryStorage() as unknown as Storage;
globalThis.WebSocket = FakeSocket as unknown as typeof WebSocket;
globalThis.alert = () => {};

beforeEach(() => {
	localStorage.clear();
	FakeSocket.opened = [];
});
