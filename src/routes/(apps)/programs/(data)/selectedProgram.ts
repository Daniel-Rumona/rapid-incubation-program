import { writable } from "svelte/store";
import type { Program } from "./schemas.js";

export const selectedProgram = writable<Program | null>(null);
