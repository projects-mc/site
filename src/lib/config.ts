import type { preloadCode } from '$app/navigation';

// One of the site's pages
export type Pathname = Parameters<typeof preloadCode>[0];

// A sidebar entry: a page, or a group of pages under a common route (which has no page of its own)
export type NavItem =
	| { title: string; route: Pathname; subitems?: undefined }
	| { title: string; route: string; subitems: { title: string; route: Pathname }[] };

export const navItems: NavItem[] = [
	{ title: 'Console', route: '/console' },
	{ title: 'Code', route: '/code' },
	{ title: 'Backups', route: '/backups' },
	{
		title: 'Options',
		route: '/options',
		subitems: [
			{ title: 'Instance', route: '/options/instance' },
			{ title: 'Databases', route: '/options/databases' },
			{ title: 'Development', route: '/options/dev' },
			{ title: 'Upgrade', route: '/options/upgrade' }
		]
	}
];

// Every page the sidebar leads to
export const navPages: Pathname[] = navItems.flatMap((item) => (item.subitems ? item.subitems.map((s) => s.route) : [item.route]));
