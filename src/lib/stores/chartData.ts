import { writable, derived } from 'svelte/store';
import { selectedNeighborhood } from './selectedNeighborhood';
import { aggregatePropertyType, aggregateRoomType } from '$lib/utils/aggregate';

export const detailedRows = writable<any[]>([]);

export const propertyTypeData = derived(
  [detailedRows, selectedNeighborhood],
  ([$rows, $selectedNeighborhood]) => {
    // console.log("Aggregating property type with:", $selectedNeighborhood);
    return aggregatePropertyType($rows, $selectedNeighborhood);
  }
);

export const roomTypeData = derived(
  [detailedRows, selectedNeighborhood],
  ([$rows, $selectedNeighborhood]) => {
    // console.log("Aggregating room type with:", $selectedNeighborhood);
    return aggregateRoomType($rows, $selectedNeighborhood);
  }
);
