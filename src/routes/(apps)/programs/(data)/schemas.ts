import { z } from "zod";

// ✅ Updated to match Firestore
export const programSchema = z.object({
	id: z.string(),
	title: z.string(), // ✅ Firestore: "programName"
	status: z.string(), // ✅ Firestore: "programStatus"
	label: z.string(), // ✅ Firestore: "programLabel"
	priority: z.string(), // ✅ Firestore: "programPriority"
	programID: z.string(), // ✅ Firestore: "programID"
	budget: z.string().optional(), // ✅ Firestore: "programBudget" (if exists)
});

// ✅ Define TypeScript type
export type Program = z.infer<typeof programSchema>;
