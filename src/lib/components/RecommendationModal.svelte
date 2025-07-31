<!-- <script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let mode: "tourist" | "investor";

  export let min = 0;
  export let max = 1000;
  export let step = 10;

  function onClose() {
    dispatch("close");
  }

  let loading = false;
  let error: string | null = null;
  let recommendations: { id: number; predicted_score: number }[] = [];

  // Default formData depending on mode
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
    { label: "B&B / Guesthouse ", value: 1 },
    { label: "Hotel / Hostel", value: 2 },
    { label: "House / Villa / Cottage", value: 3 },
    { label: "Other", value: 4 },
    { label: "Unique Stays", value: 5 },
  ];

  async function fetchRecommendations() {
    loading = true;
    error = null;
    recommendations = [];

    const queryParams = new URLSearchParams();

    if (mode === "tourist") {
      if (formData.accommodates)
        queryParams.append("accommodates", formData.accommodates);
      if (formData.room_type_code !== null)
        queryParams.append("room_type_code", formData.room_type_code);
      if (formData.host_is_superhost)
        queryParams.append("host_is_superhost", "1");
      if (formData.minimum_nights)
        queryParams.append("minimum_nights", formData.minimum_nights);
      if (formData.min_price !== null)
        queryParams.append("min_price", formData.min_price);
      if (formData.max_price !== null)
        queryParams.append("max_price", formData.max_price);
      if (formData.review_scores_rating !== null)
        queryParams.append(
          "review_scores_rating",
          formData.review_scores_rating,
        );
    } else {
      if (formData.min_price !== null)
        queryParams.append("min_price", formData.min_price);
      if (formData.min_occupancy !== null)
        queryParams.append("min_occupancy", formData.min_occupancy);
      if (formData.minimum_nights)
        queryParams.append("minimum_nights", formData.minimum_nights);
      if (formData.property_type_code !== null)
        queryParams.append("property_type_code", formData.property_type_code);
    }

    queryParams.append("limit", "5");
    const url = `http://localhost:8000/recommend/${mode}?${queryParams.toString()}`;
    console.log("Recco URL is", url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      recommendations = data.recommendations;
    } catch (err) {
      error = err.message || "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  let isSuperhost = false;
  let isInstantBookable = false;

  // Toggle handlers
  function toggleSuperhost() {
    formData.host_is_superhost = !isSuperhost;
  }

  function toggleInstantBookable() {
    isInstantBookable = !isInstantBookable;
  }

  export let minPrice = 200;
  export let maxPrice = 800;

  // Clamp minPrice so it never crosses maxPrice
  function onMinChange(e) {
    minPrice = Math.min(Number(e.target.value), maxPrice - step);
  }

  // Clamp maxPrice so it never is less than minPrice
  function onMaxChange(e) {
    maxPrice = Math.max(Number(e.target.value), minPrice + step);
  }

  // Calculate % for slider track styling
  $: minPercent = ((minPrice - min) / (max - min)) * 100;
  $: maxPercent = ((maxPrice - min) / (max - min)) * 100;

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div class="modal-overlay" role="button" tabindex="0">
  <div
    class="modal-content"
    aria-modal="true"
    aria-label="Recommendation Results"
  >
    <h2>{mode === "tourist" ? "Tourist" : "Investor"} Recommendations</h2>

    <form on:submit|preventDefault={fetchRecommendations}>
      {#if mode === "tourist"}
        <label
          >Accommodates <input
            type="number"
            bind:value={formData.accommodates}
            min="1"
          /></label
        >
        <label for="roomType">Room Type</label>
        <select id="roomType" bind:value={formData.room_type_code}>
          {#each room_types as type}
            <option value={type.value}>
              {type.label}
            </option>
          {/each}
        </select>

        <!-- <label
          >Room Type Code <input
            type="number"
            bind:value={formData.room_type_code}
            min="0"
          /></label
        > -->
        <!-- <label
          >Superhost <input
            type="checkbox"
            bind:checked={formData.host_is_superhost}
          /></label
        > 
        <div
          role="group"
          aria-label="Superhost and Instant Bookable filters"
          class="button-toggle-group"
        >
          <button
            type="button"
            aria-pressed={isSuperhost}
            class:selected={isSuperhost}
            on:click={toggleSuperhost}
          >
            Superhost
          </button>
          <!-- <button
            type="button"
            aria-pressed={isInstantBookable}
            class:selected={isInstantBookable}
            on:click={toggleInstantBookable}
          >
            Instant Bookable
          </button>
        </div>

        <label
          >Min Nights <input
            type="number"
            bind:value={formData.minimum_nights}
            min="1"
          /></label
        >
        <label
          >Min Price <input
            type="number"
            bind:value={formData.min_price}
            min="0"
          /></label
        >
        <label
          >Max Price <input
            type="number"
            bind:value={formData.max_price}
            min="0"
          /></label
        >
        <label
          >Min Rating <input
            type="range"
            bind:value={formData.review_scores_rating}
            min="0"
            max="5"
            step="0.1"
          /></label
        >

        <div class="slider-container">
          <div class="slider">
            <div
              class="slider-track"
              style="left: {minPercent}%; right: {100 - maxPercent}%;"
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
            <span class="value-min">€{minPrice}</span>
            <span class="value-max">€{maxPrice}</span>
          </div>
        </div>
      {:else}
        <label
          >Min Price <input
            type="number"
            bind:value={formData.min_price}
            min="0"
          /></label
        >
        <label
          >Min Occupancy <input
            type="range"
            bind:value={formData.min_occupancy}
            min="0"
            max="1"
            step="0.05"
          /></label
        >
        <label
          >Min Nights <input
            type="number"
            bind:value={formData.minimum_nights}
            min="1"
          /></label
        >
        <label for="roomType">Property Type</label>
        <select id="roomType" bind:value={formData.property_type_code}>
          {#each property_types as type}
            <option value={type.value}>
              {type.label}
            </option>
          {/each}
        </select>
        <!-- <label
          >Property Type Code <input
            type="number"
            bind:value={formData.property_type_code}
            min="0"
          /></label
        > 
      {/if}

      <button type="submit" disabled={loading}>Get Recommendations</button>
    </form>

    {#if loading}
      <p>Loading...</p>
    {:else if error}
      <p style="color: red;">{error}</p>
    {:else if recommendations.length > 0}
      <h3 class="results-title">Top Listings</h3>
      <div class="recommendation-list">
        {#each recommendations as rec}
          <div class="recommendation-card">
            <p><strong>ID:</strong> {rec.id}</p>
            <p>
              <strong>{mode === "tourist" ? "Rating" : "Revenue"}:</strong>
              {rec.predicted_score.toFixed(2)}
            </p>
          </div>
        {/each}
      </div>
    {/if}

    <button class="close-btn" on:click={onClose}>Close</button>
  </div>
</div>

<style>
  .button-toggle-group {
    display: flex;
    gap: 1.25rem;
  }

  button {
    padding: 0.45rem 1.2rem;
    border-radius: 14px;
    border: 2px solid #4d65fa;
    background-color: white;
    color: #4d65fa;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      background-color 0.25s,
      color 0.25s;
    user-select: none;
    outline-offset: 2px;
  }

  button:hover {
    background-color: #e6ebff;
  }

  button.selected {
    background-color: #4d65fa;
    color: white;
  }

  button:focus {
    outline: 3px solid #82a8ff;
    outline-offset: 2px;
  }

  .toggle-button {
    padding: 0.45rem 1.2rem;
    border-radius: 14px;
    border: 2px solid #4d65fa;
    background-color: white;
    color: #4d65fa;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition:
      background-color 0.25s,
      color 0.25s;
    user-select: none;
  }

  .toggle-button:hover {
    background-color: #e6ebff;
  }

  .toggle-button.selected {
    background-color: #4d65fa;
    color: white;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 600px;
    width: 90%;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
    overflow-y: auto;
    max-height: 90vh;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    font-weight: 500;
    font-size: 0.95rem;
  }

  input[type="number"],
  input[type="range"] {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid #ccc;
    margin-top: 0.25rem;
  }

  input[type="checkbox"] {
    margin-top: 0.5rem;
    transform: scale(1.1);
  }

  button[type="submit"] {
    background-color: #0077cc;
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
  }

  button[type="submit"]:disabled {
    background-color: #8ab6d6;
    cursor: not-allowed;
  }

  .close-btn {
    margin-top: 1.5rem;
    background-color: transparent;
    border: 1px solid #0077cc;
    border-radius: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    cursor: pointer;
    color: #0077cc;
  }

  .results-title {
    margin-top: 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 1px solid #ddd;
    padding-bottom: 0.5rem;
  }

  .recommendation-list {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .recommendation-card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 0.75rem;
    background-color: #fafafa;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .recommendation-card p {
    margin: 0.25rem 0;
  }

  .slider-container {
    width: 320px;
    user-select: none;
    font-family: "Inter", sans-serif;
  }

  .slider {
    position: relative;
    width: 100%;
    height: 6px;
    border-radius: 8px;
    background-color: #ddd;
  }

  .slider-track {
    position: absolute;
    height: 6px;
    border-radius: 8px;
    background-color: #4d65fa;
    top: 0;
  }

  input[type="range"] {
    position: absolute;
    top: -6px;
    width: 100%;
    height: 18px;
    background: transparent;
    pointer-events: auto;
    margin: 0;
    -webkit-appearance: none;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    background: transparent;
  }
  input[type="range"]::-moz-range-track {
    height: 6px;
    background: transparent;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 18px;
    width: 18px;
    background: #4d65fa;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    margin-top: -6px;
    position: relative;
    z-index: 2;
  }
  input[type="range"]::-moz-range-thumb {
    height: 18px;
    width: 18px;
    background: #4d65fa;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    position: relative;
    z-index: 2;
  }

  .thumb-left {
    z-index: 3;
  }

  .values {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95rem;
  }
</style> -->


<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let mode: "tourist" | "investor";

  export let min = 0;
  export let max = 1000;
  export let step = 10;

  function onClose() {
    dispatch("close");
  }

  let loading = false;
  let error: string | null = null;
  let recommendations: { id: number; predicted_score: number }[] = [];

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
    { label: "B&B / Guesthouse ", value: 1 },
    { label: "Hotel / Hostel", value: 2 },
    { label: "House / Villa / Cottage", value: 3 },
    { label: "Other", value: 4 },
    { label: "Unique Stays", value: 5 },
  ];

  async function fetchRecommendations() {
    loading = true;
    error = null;
    recommendations = [];

    const queryParams = new URLSearchParams();

    if (mode === "tourist") {
      if (formData.accommodates)
        queryParams.append("accommodates", formData.accommodates);
      if (formData.room_type_code !== null)
        queryParams.append("room_type_code", formData.room_type_code);
      if (formData.host_is_superhost)
        queryParams.append("host_is_superhost", "1");
      if (formData.minimum_nights)
        queryParams.append("minimum_nights", formData.minimum_nights);
      if (formData.min_price !== null)
        queryParams.append("min_price", formData.min_price);
      if (formData.max_price !== null)
        queryParams.append("max_price", formData.max_price);
      if (formData.review_scores_rating !== null)
        queryParams.append("review_scores_rating", formData.review_scores_rating);
    } else {
      if (formData.min_price !== null)
        queryParams.append("min_price", formData.min_price);
      if (formData.min_occupancy !== null)
        queryParams.append("min_occupancy", formData.min_occupancy);
      if (formData.minimum_nights)
        queryParams.append("minimum_nights", formData.minimum_nights);
      if (formData.property_type_code !== null)
        queryParams.append("property_type_code", formData.property_type_code);
    }

    queryParams.append("limit", "5");
    const url = `http://localhost:8000/recommend/${mode}?${queryParams.toString()}`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      recommendations = data.recommendations;
    } catch (err) {
      error = err.message || "Unknown error occurred";
    } finally {
      loading = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") onClose();
  }

  let isSuperhost = false;
  let isInstantBookable = false;

  function toggleSuperhost() {
    formData.host_is_superhost = !isSuperhost;
  }

  function toggleInstantBookable() {
    isInstantBookable = !isInstantBookable;
  }

  export let minPrice = 200;
  export let maxPrice = 800;

  function onMinChange(e) {
    minPrice = Math.min(Number(e.target.value), maxPrice - step);
  }

  function onMaxChange(e) {
    maxPrice = Math.max(Number(e.target.value), minPrice + step);
  }

  $: minPercent = ((minPrice - min) / (max - min)) * 100;
  $: maxPercent = ((maxPrice - min) / (max - min)) * 100;

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });
</script>

<div class="modal-overlay" role="button" tabindex="0">
  <div class="modal-content" aria-modal="true" aria-label="Recommendation Results">
    <h2>{mode === "tourist" ? "Tourist" : "Investor"} Recommendations</h2>

    <form on:submit|preventDefault={fetchRecommendations}>
      {#if mode === "tourist"}
        <h3>Basic Preferences</h3>
        <div class=" input-grid">
          <label>
            Guests
            <input class="input-uniform" type="number" bind:value={formData.accommodates} min="1" />
          </label>

          <label>
            Minimum Nights
            <input type="number" bind:value={formData.minimum_nights} min="1" />
          </label>

          <label for="roomType">Room Type</label>
          <select id="roomType" bind:value={formData.room_type_code}>
            {#each room_types as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>

          <label>
            Min Rating
            <input
              type="range"
              bind:value={formData.review_scores_rating}
              min="0"
              max="5"
              step="0.1"
            />
            <span class="range-display">{formData.review_scores_rating.toFixed(1)}</span>
          </label>
        </div>

        <h3>Price Range</h3>
        <div class="slider-container">
          <div class="slider">
            <div
              class="slider-track"
              style="left: {minPercent}%; right: {100 - maxPercent}%;"
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
            <span class="value-min">€{minPrice}</span>
            <span class="value-max">€{maxPrice}</span>
          </div>
        </div>

        <h3>Filters</h3>
        <div class="button-toggle-group">
          <button
            type="button"
            aria-pressed={isSuperhost}
            class:selected={isSuperhost}
            on:click={toggleSuperhost}
          >
            Superhost
          </button>
        </div>
      {:else}
        <h3>Financial Preferences</h3>
        <div class="input-grid">
          <label>
            Minimum Price
            <input type="number" bind:value={formData.min_price} min="0" />
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
            <span class="range-display">{formData.min_occupancy.toFixed(2)}</span>
          </label>

         
          <label for="propertyType">Property Type</label>
          <select id="propertyType" bind:value={formData.property_type_code}>
            {#each property_types as type}
              <option value={type.value}>{type.label}</option>
            {/each}
          </select>
        </div>
      {/if}
      <button type="submit" disabled={loading}>Get Recommendations</button>
      <button class="close-btn" on:click={onClose}>Close</button>
    </form>
    {#if loading}
      <p>Loading...</p>
    {:else if error}
      <p style="color: red;">{error}</p>
    {:else if recommendations.length > 0}
      <h3 class="results-title">Top Listings</h3>
      <div class="recommendation-list">
        {#each recommendations as rec}
          <div class="recommendation-card">
            <p><strong>ID:</strong> {rec.id}</p>
            <p>
              <strong>{mode === "tourist" ? "Rating" : "Revenue"}:</strong>
              {rec.predicted_score.toFixed(2)}
            </p>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .input-uniform {
  width: 100%;
  box-sizing: border-box;
}

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: #fff;
    padding: 2rem;
    border-radius: 1rem;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  }

  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem 2rem;
    margin-bottom: 1rem;
  }

  .range-display {
    font-size: 0.9rem;
    margin-left: 0.5rem;
    color: #555;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-top: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    font-size: 0.95rem;
    font-weight: 500;
  }

  input[type="number"],
  select,
  input[type="range"] {
    padding: 0.5rem;
    border-radius: 0.5rem;
    border: 1px solid #ccc;
    margin-top: 0.25rem;
  }

  .button-toggle-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 12px;
    border: 2px solid #4d65fa;
    background-color: white;
    color: #4d65fa;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  button:hover {
    background-color: #f1f4ff;
  }

  button.selected {
    background-color: #4d65fa;
    color: white;
  }

  button[type="submit"] {
    background-color: #0077cc;
    color: white;
    border: none;
    font-weight: bold;
    font-size: 1rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    margin-top: 0.5rem;
  }

  button[type="submit"]:disabled {
    background-color: #a8c8e3;
    cursor: not-allowed;
  }

  .close-btn {
    margin-top: 1.5rem;
    background-color: transparent;
    border: 1px solid #0077cc;
    border-radius: 0.75rem;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    cursor: pointer;
    color: #0077cc;
  }

  .results-title {
    font-size: 1.1rem;
    font-weight: 600;
    border-bottom: 1px solid #ccc;
    padding-bottom: 0.5rem;
    margin-top: 2rem;
  }

  .recommendation-list {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .recommendation-card {
    background: #f8f8f8;
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid #ddd;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .recommendation-card p {
    margin: 0.25rem 0;
  }

  /* Slider styles */
  .slider-container {
    width: 100%;
    font-family: inherit;
  }

  .slider {
    position: relative;
    width: 100%;
    height: 6px;
    border-radius: 6px;
    background-color: #ddd;
    margin: 1rem 0 0.25rem;
  }

  .slider-track {
    position: absolute;
    height: 6px;
    border-radius: 6px;
    background-color: #4d65fa;
    top: 0;
  }

  input[type="range"].thumb {
    position: absolute;
    top: -6px;
    width: 100%;
    height: 6px;
    background: transparent;
    pointer-events: auto;
    margin: 0;
    -webkit-appearance: none;
  }

  input[type="range"].thumb::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 16px;
  width: 16px;
  background: #0077cc;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  margin-top: -6px;
}

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 18px;
    width: 18px;
    background: #4d65fa;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    margin-top: -6px;
    z-index: 2;
    position: relative;
  }

  input[type="range"]::-moz-range-thumb {
    height: 18px;
    width: 18px;
    background: #4d65fa;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    position: relative;
    z-index: 2;
  }

  input[type="range"].thumb::-moz-range-thumb {
  height: 16px;
  width: 16px;
  background: #0077cc;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  }

  .values {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.95rem;
    margin-top: 0.25rem;
  }
</style>
