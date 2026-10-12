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
		title: 'Options',
		route: '/options',
		subitems: [
			{
				title: 'Instance',
				route: 'instance'
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
