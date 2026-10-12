// Svelte action: use:tooltip={text} shows text in a small pixel box above the element on hover or keyboard focus.
// It lives in the top layer (a popover), so the clipped corners of pixel boxes can't cut it off
export function tooltip(node, text) {
	const tip = document.createElement('span');
	tip.className = 'tooltip pixelBox';
	tip.popover = 'manual';
	tip.textContent = text;
	document.body.append(tip);

	function show() {
		if (!tip.textContent) return;
		tip.showPopover();
		const box = node.getBoundingClientRect();
		const centred = box.left + box.width / 2 - tip.offsetWidth / 2;
		tip.style.left = `${Math.min(Math.max(4, centred), innerWidth - tip.offsetWidth - 4)}px`; // stay inside the window
		tip.style.top = `${box.top - tip.offsetHeight - 6}px`;
	}
	const hide = () => tip.hidePopover();

	const events = { mouseenter: show, mouseleave: hide, focus: show, blur: hide };
	for (const [name, handler] of Object.entries(events)) node.addEventListener(name, handler);

	return {
		update(newText) {
			tip.textContent = newText;
		},
		destroy() {
			for (const [name, handler] of Object.entries(events)) node.removeEventListener(name, handler);
			tip.remove();
		}
	};
}
