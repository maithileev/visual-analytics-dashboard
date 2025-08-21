<script lang="ts">
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();
  import RangeSlider from "svelte-range-slider-pips";
  import { writable } from "svelte/store";
  import { fetchListingByUrl } from "$lib/utils/fetchListings";

  let priceRange: [number, number] = [50, 200]; // initial min & max
  let priceMinValue = 50;
  let priceMaxValue = 200;
  let start;
  let end;

  const nice = (d) => {
    if (!d && d !== 0) return "";
    return d.toFixed(2);
  };

  export async function loadListing(listing_url: string) {
    const row = await fetchListingByUrl(listing_url);

    if (!row) return null;

  // fix price parsing
  let priceStr = row['price']?.trim() || '0';
  priceStr = priceStr.replace(/[^0-9.]/g, '');
  const price = parseFloat(priceStr);

  return {
    id: row['id'],
    name: row['name'],
    picture_url: row['picture_url'],
    price: isNaN(price) ? 0 : price,
    review_scores_rating: row['review_scores_rating'],
  };
}

  export let mode: "tourist" | "investor";
  let showAll = false;

  $: displayedRecommendations = showAll
    ? recommendations.slice().reverse()
    : recommendations.slice().reverse().slice(0, 5);

  let loading = false;
  let error: string | null = null;
  let recommendations: {
    listing_id: string;
    listing_url: string;
    predicted_score: number;
  }[] = [];

  let formData: any = {
    accommodates: 2,
    host_is_superhost: false,
    room_type_code: 0,
    minimum_nights: 1,
    min_price: 0,
    max_price: 300,
    review_scores_rating: 4.0,
    min_occupancy: 0.5,
    property_type_code: 0,
  };

  const room_types = [
    { label: "Entire home/apt", value: 0 },
    { label: "Hotel Room", value: 1 },
    { label: "Private room", value: 2 },
    { label: "Shared room", value: 3 },
  ];

  const property_types = [
    { label: "Apt / Condo", value: 0 },
    { label: "B&B / Guesthouse", value: 1 },
    { label: "Hotel / Hostel", value: 2 },
    { label: "House / Villa / Cottage", value: 3 },
    { label: "Other", value: 4 },
    { label: "Unique Stays", value: 5 },
  ];

  let minPrice = 200;
  let maxPrice = 800;
  const min = 0;
  const max = 1000;
  const step = 10;

  $: minPercent = ((minPrice - min) / (max - min)) * 100;
  $: maxPercent = ((maxPrice - min) / (max - min)) * 100;

  function onMinChange(e) {
    minPrice = Math.min(Number(e.target.value), maxPrice - step);
  }

  function onMaxChange(e) {
    maxPrice = Math.max(Number(e.target.value), minPrice + step);
  }

  function toggleSuperhost() {
    formData.host_is_superhost = !formData.host_is_superhost;
  }

  async function fetchRecommendations() {
    loading = true;
    error = null;
    recommendations = [];
    try {
      const queryParams = new URLSearchParams();
      if (mode === "tourist") {
        if (formData.accommodates)
          queryParams.append("accommodates", formData.accommodates);
        queryParams.append("room_type_code", formData.room_type_code);
        if (formData.host_is_superhost)
          queryParams.append("host_is_superhost", "1");
        queryParams.append("minimum_nights", formData.minimum_nights);
        queryParams.append("min_price", minPrice);
        queryParams.append("max_price", maxPrice);
        queryParams.append(
          "review_scores_rating",
          formData.review_scores_rating,
        );
      } else {
        queryParams.append("min_price", minPrice);
        queryParams.append("minimum_nights", formData.minimum_nights);
        queryParams.append("min_occupancy", formData.min_occupancy);
        queryParams.append("property_type_code", formData.property_type_code);
      }
      queryParams.append("limit", "10");

      const res = await fetch(
        `http://localhost:8000/recommend/${mode}?${queryParams.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      recommendations = data.recommendations.reverse();
    } catch (err: any) {
      error = err.message || "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  function onClose() {
    dispatch("close");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div class="modal-overlay">
  <div class="modal-content">
    <h2>{mode === "tourist" ? "Tourist" : "Investor"} Recommendations</h2>

    <form on:submit|preventDefault={fetchRecommendations}>
      <div class="form-row">
        {#if mode === "tourist"}
          <label>
            Guests
            <input type="number" bind:value={formData.accommodates} min="1" />
          </label>

          <label>
            Minimum Nights
            <input type="number" bind:value={formData.minimum_nights} min="1" />
          </label>

          <label>
            Room Type
            <select bind:value={formData.room_type_code}>
              {#each room_types as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </label>

          <label>
            Minimum Rating
            <input
              type="range"
              bind:value={formData.review_scores_rating}
              min="0"
              max="5"
              step="0.1"
            />
            <span class="range-display"
              >{formData.review_scores_rating.toFixed(1)}</span
            >
          </label>

          <label
            >Price Range
            <div class="slider-container">
              <div class="slider">
                <div
                  class="slider-track"
                  style="left: calc({minPercent}% + 8px); right: calc({100 -
                    maxPercent}% + 8px);"
                ></div>

                <input
                  type="range"
                  {min}
                  {max}
                  {step}
                  bind:value={minPrice}
                  on:input={onMinChange}
                  class="thumb thumb-left"
                  aria-label="Minimum price"
                />
                <input
                  type="range"
                  {min}
                  {max}
                  {step}
                  bind:value={maxPrice}
                  on:input={onMaxChange}
                  class="thumb thumb-right"
                  aria-label="Maximum price"
                />
              </div>

              <div class="values">
                <span class="value-min">${minPrice}</span>
                <span class="value-max">${maxPrice}</span>
              </div>
            </div>
          </label>
          <button
            type="button"
            class:selected={formData.host_is_superhost}
            on:click={toggleSuperhost}>Superhost</button
          >
        {:else}
          <label>
            Minimum Price
            <input type="number" bind:value={minPrice} min="0" />
          </label>

          <label>
            Minimum Nights
            <input type="number" bind:value={formData.minimum_nights} min="1" />
          </label>

          <label>
            Occupancy
            <input
              type="range"
              bind:value={formData.min_occupancy}
              min="0"
              max="1"
              step="0.05"
            />
            <span class="range-display"
              >{formData.min_occupancy.toFixed(2)}</span
            >
          </label>

          <label>
            Property Type
            <select bind:value={formData.property_type_code}>
              {#each property_types as type}
                <option value={type.value}>{type.label}</option>
              {/each}
            </select>
          </label>
        {/if}
      </div>

      <div class="form-actions">
        <button type="submit" disabled={loading}>Get Recommendations</button>
        <button type="button" class="close-btn" on:click={onClose}>Close</button
        >
      </div>
    </form>

    {#if loading}
      <p>Loading...</p>
    {:else if error}
      <p class="error">{error}</p>
    {:else if recommendations.length > 0}
      <h3>Top Listings</h3>
      <div class="recommendation-list">
        {#each displayedRecommendations as rec (rec.listing_id)}
          {#await fetchListingByUrl(rec.listing_url) then listing}
            {#if listing}
            <div class="recommendation-card p-3 border rounded-lg shadow-sm w-60">
              <img
                  src={listing.picture_url}
                  alt={listing.name}
                  class="listing-image rounded-md h-28 w-full object-cover"
                />
                <p class="text-sm font-semibold mt-2 truncate"><strong>{listing.name}</strong></p>
                <!-- <p class = "text-xs font-medium text-gray-800">$ {listing.price}</p>
                <p class="text-xs text-gray-600">⭐ {listing.review_scores_rating?.toFixed(1)}</p> -->
                <a href={rec.listing_url} target="_blank" class="mt-2 inline-block px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <button type="button">View Listing</button>
                </a>
              </div>
            {:else}
              <div class="recommendation-card">
                <p>Listing not found</p>
              </div>
            {/if}
          {/await}
        {/each}
      </div>

      {#if recommendations.length > 5}
        <button type="button" on:click={() => (showAll = !showAll)}>
          {showAll ? "Show Less" : "See More"}
        </button>
      {/if}
    {/if}
  </div>
</div>

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #fff;
    border-radius: 1rem;
    padding: 2rem;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-weight: 500;
    font-size: 0.95rem;
  }

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 1.5rem; /* uniform spacing */
  }

  label {
    display: flex;
    flex-direction: column;
    font-weight: 500;
    font-size: 0.95rem;
    gap: 0.3rem;
  }

  input[type="number"],
  select,
  input[type="range"] {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid #ccc;
    font-size: 0.95rem;
    width: 100%;
    box-sizing: border-box;
  }

  select {
    appearance: none;
    background: white;
  }

  button {
    width: fit-content; /* shrink to content width */
    cursor: pointer;
    border-radius: 12px;
    border: 2px solid #4d65fa;
    background-color: white;
    color: #4d65fa;
    font-weight: 600;
    font-size: 0.95rem;
    padding: 0.5rem 1rem;
    transition: 0.2s all;
  }

  button:hover {
    background-color: #f1f4ff;
  }
  button.selected {
    background-color: #4d65fa;
    color: white;
  }

  .form-actions {
    display: flex;
    gap: 1rem; /* uniform spacing between buttons */
    flex-wrap: wrap;
    margin-top: 1.5rem; /* added spacing above buttons */
  }

  button[type="submit"] {
    background: #1e40af;
    color: white;
    border: none;
    font-weight: bold;
    font-size: 1rem;
    padding: 0.75rem;
  }

  button[type="submit"]:disabled {
    background: #a8c8e3;
    cursor: not-allowed;
  }

  .close-btn {
    border: 1px solid #0077cc;
    color: #0077cc;
  }

  .slider {
    position: relative;
    height: 6px;
    background: #ddd;
    border-radius: 6px;
  }

  .slider-container {
    position: relative;
    height: 6px;
    margin: 0.5rem 0 1.5rem 0;
  }

  .slider-track {
    position: absolute;
    height: 6px;
    background: #4d65fa;
    border-radius: 6px;
    top: 0;
    transform: translateY(0); /* keep vertical as is */
  }

  input[type="range"].thumb {
    position: absolute;
    width: 100%;
    border: none;
    background: none;
    pointer-events: none; /* prevents overlap issues */
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    height: 6px;
  }

  input[type="range"].thumb::-webkit-slider-thumb {
    -webkit-appearance: none;
    outline: none; /* removes the default rectangle */
    border: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #0077cc;
    cursor: pointer;
    pointer-events: all; /* re-enable dragging */
    position: relative;
    z-index: 2;
    margin-top: -15px; /* centers thumb vertically on the track */
  }

  input[type="range"].thumb:focus {
    outline: none;
    box-shadow: none; /* remove glow/rectangle */
  }

  input[type="range"].thumb::-moz-range-thumb {
    outline: none; /* removes the default rectangle */
    border: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #0077cc;
    cursor: pointer;
    pointer-events: all;
    border: none;
    position: relative;
    z-index: 2;
  }

  /* --- Slider values --- */
  .slider-values {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    font-size: 0.95rem;
    margin-top: 0.5rem;
    color: #2c3e50;
  }

  .values {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    color: #2c3e50;
  }
  .range-display {
    margin-left: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }

  .recommendation-card {
    padding: 0.75rem;
  background: #f8f8f8;
  border-radius: 0.75rem;
  border: 1px solid #ddd;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
    }
    
    .recommendation-card p {
      font-size: 0.8rem; /* shrink text */
  margin: 0.2rem 0;
  }

  .recommendation-list {
    display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 cards per row */
  gap: 1rem; /* spacing between cards */
  }

  .listing-image {
    width: 100%;
  height: 100px; /* smaller image */
  border-radius: 0.5rem;
  margin-bottom: 0.4rem;
  object-fit: cover;
  }

  .recommendation-card a button {
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
}

</style>
