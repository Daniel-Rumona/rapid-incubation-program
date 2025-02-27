import { z } from "zod";
import { type Actions, fail } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types.js";

// Define schema using Zod
const profileFormSchema = z.object({
	username: z
		.string()
		.min(2, "Username must be at least 2 characters.")
		.max(30, "Username must not be longer than 30 characters"),
	email: z.string().email("Please enter a valid email"),
	bio: z.string().min(4).max(160),
	urls: z.array(z.string().url()).default([]),
});

export const load: PageServerLoad = async () => {
	// Return an empty form structure for the client
	return {
		form: {
			username: "",
			email: "",
			bio: "I own a computer.",
			urls: ["https://shadcn.com", "https://twitter.com/shadcn"],
			errors: {},
		},
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = Object.fromEntries(await request.formData());

		// Validate against schema
		const validation = profileFormSchema.safeParse({
			username: formData.username,
			email: formData.email,
			bio: formData.bio,
			urls: (formData.urls as string)?.split(",") || [],
		});

		if (!validation.success) {
			return fail(400, {
				form: {
					...formData,
					errors: validation.error.flatten().fieldErrors, // Send errors for display
				},
			});
		}

		// If valid, return cleaned data
		return {
			form: {
				...validation.data,
				errors: {},
			},
		};
	},
};
