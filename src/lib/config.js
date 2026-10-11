export const navItems = [
	{
		title: 'Console',
		route: '/console'
	},
	{
		title: 'Code',
		route: '/code'
	},
	{
		title: 'Backups',
		route: '/backups'
	},
	{
		title: 'Settings',
		route: '/settings',
		subitems: [
			{
				title: 'Instance',
				route: 'options'
			},
			{
				title: 'Development',
				route: 'dev'
			},
			{
				title: 'Upgrade',
				route: 'upgrade'
			}
		]
	}
];
