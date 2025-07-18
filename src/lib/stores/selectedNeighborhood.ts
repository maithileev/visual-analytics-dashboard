import { writable } from 'svelte/store';

export const selectedNeighborhood = writable<string | null>(null);
