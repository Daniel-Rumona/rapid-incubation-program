import type { NavItem } from "$lib/types/nav.js";

type DocsConfig = {
	mainNav: NavItem[];
};

export const docsConfig: DocsConfig = {
	mainNav: [
		{
			title: "Dashboard",
			href: "/",
		},
		{
			title: "Applications",
			href: "/applications",
		},
		{
			title: "Applicants",
			href: "/applicants",
		},
		{
			title: "Programs",
			href: "/programs",
		},
		{
			title: "Settings",
			href: "/settings",
		},
	],
};

