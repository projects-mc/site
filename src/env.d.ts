// What the dashboard reads from the build's environment (.env, see .env.example)
interface ImportMetaEnv {
	// aspen's address; https://api.playboardmc.com if unset
	readonly VITE_API_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
