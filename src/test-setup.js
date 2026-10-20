// The browser APIs the dashboard's modules use, faked for unit tests running in Node
import { beforeEach } from 'vitest';

class MemoryStorage {
	#items = new Map();
	getItem = (key) => (this.#items.has(key) ? this.#items.get(key) : null);
	setItem = (key, value) => this.#items.set(key, String(value));
	removeItem = (key) => this.#items.delete(key);
	clear = () => this.#items.clear();
}

// Records every socket opened; tests drive them with receive() and close()
export class FakeSocket {
	static opened = [];
	constructor(url) {
		this.url = url;
		this.sent = [];
		this.closed = false;
		FakeSocket.opened.push(this);
	}
	send(data) {
		this.sent.push(data);
	}
	receive(data) {
		this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
	}
	close() {
		if (this.closed) return;
		this.closed = true;
		this.onclose?.({});
	}
}

globalThis.localStorage = new MemoryStorage();
globalThis.WebSocket = FakeSocket;
globalThis.alert = () => {};

beforeEach(() => {
	localStorage.clear();
	FakeSocket.opened = [];
});
