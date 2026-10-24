// Minecraft-style small caps: each letter swapped for its Unicode small capital, which Monocraft draws 5 pixels tall.
// There is no small capital q, so it stays a plain q
const SMALL_CAPS = Array.from('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ');

export const smallCaps = (text: string) =>
	text.replace(/[a-z]/gi, (letter) => SMALL_CAPS[letter.toLowerCase().charCodeAt(0) - 97] ?? letter);
