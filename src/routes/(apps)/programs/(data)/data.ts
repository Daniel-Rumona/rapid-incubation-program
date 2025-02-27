import ArrowDown from "svelte-radix/ArrowDown.svelte";
import ArrowRight from "svelte-radix/ArrowRight.svelte";
import ArrowUp from "svelte-radix/ArrowUp.svelte";
import CheckCircled from "svelte-radix/CheckCircled.svelte";
import Circle from "svelte-radix/Circle.svelte";
import CrossCircled from "svelte-radix/CrossCircled.svelte";
import QuestionMarkCircled from "svelte-radix/QuestionMarkCircled.svelte";
import Stopwatch from "svelte-radix/Stopwatch.svelte";

export const labels = [
	{
		value: "business development",
		label: "Business Development",
	},
	{
		value: "supply chain integration",
		label: "Supply Chain Integration",
	},
	{
		value: "manufacturing support",
		label: "Manufacturing Support",
	},
	{
		value: "fashion industry",
		label: "Fashion Industry",
	},
	{
		value: "agriculture",
		label: "Agriculture",
	},
	{
		value: "training & skills",
		label: "Training & Skills",
	},
	{
		value: "innovation & technology",
		label: "Innovation & Technology",
	},
	{
		value: "funding support",
		label: "Funding Support",
	},
	{
		value: "youth & women empowerment",
		label: "Youth & Women Empowerment",
	},
	{
		value: "startup ecosystem",
		label: "Startup Ecosystem",
	},
];

export const statuses = [
	{
		value: "backlog",
		label: "Backlog",
		icon: QuestionMarkCircled,
	},
	{
		value: "todo",
		label: "Todo",
		icon: Circle,
	},
	{
		value: "in progress",
		label: "In Progress",
		icon: Stopwatch,
	},
	{
		value: "done",
		label: "Done",
		icon: CheckCircled,
	},
	{
		value: "canceled",
		label: "Canceled",
		icon: CrossCircled,
	},
];

export const priorities = [
	{
		label: "Low",
		value: "low",
		icon: ArrowDown,
	},
	{
		label: "Medium",
		value: "medium",
		icon: ArrowRight,
	},
	{
		label: "High",
		value: "high",
		icon: ArrowUp,
	},
];
