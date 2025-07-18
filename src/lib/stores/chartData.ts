import { writable, derived } from 'svelte/store';
import { selectedNeighborhood } from './selectedNeighborhood';
import { aggregatePropertyType } from '$lib/utils/aggregate';

// Raw data passed from the page load function
export const detailedRows = writable<any[]>([]);

// Derived chart data, recalculates when either changes
export const propertyTypeData = derived(
  [detailedRows, selectedNeighborhood],
  ([$rows, $selectedNeighborhood]) => {
    console.log("Aggregating property type with:", $selectedNeighborhood);
    return aggregatePropertyType($rows, $selectedNeighborhood);
  }
);
