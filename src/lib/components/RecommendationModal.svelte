<script lang="ts">
    import { createEventDispatcher } from 'svelte';
  
    export let mode: 'tourist' | 'investor';
    export let open: boolean;
  
    const dispatch = createEventDispatcher();
  
    let accommodates = 2;
    let minimum_nights = 1;
    let room_type_code = 0;
    let review_scores_rating = 4;
    let host_is_superhost = false;
    let instant_bookable = false;
    let min_price = 50;
    let max_price = 250;
    let min_occupancy = 0.5;
    let property_type_code = 0;
  
    async function fetchRecommendations() {
      const params = new URLSearchParams();
  
      if (mode === 'tourist') {
        params.append('accommodates', String(accommodates));
        params.append('minimum_nights', String(minimum_nights));
        params.append('room_type_code', String(room_type_code));
        params.append('review_scores_rating', String(review_scores_rating));
        params.append('host_is_superhost', String(Number(host_is_superhost)));
        params.append('instant_bookable', String(Number(instant_bookable)));
        params.append('min_price', String(min_price));
        params.append('max_price', String(max_price));
      } else if (mode === 'investor') {
        params.append('minimum_nights', String(minimum_nights));
        params.append('min_occupancy', String(min_occupancy));
        params.append('property_type_code', String(property_type_code));
        params.append('min_price', String(min_price));
        params.append('max_price', String(max_price));
      }
  
      params.append('limit', '5');
  
      const res = await fetch(`/recommend/${mode}?` + params.toString());
      const data = await res.json();
      dispatch('close');
      dispatch('recommendations', { ids: data.recommendations });
    }
  
    function closeModal() {
      dispatch('close');
    }
  </script>
  
  {#if open}
    <div class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2>{mode === 'tourist' ? 'Tourist' : 'Investor'} Recommendations</h2>
          <button class="close-button" on:click={closeModal}>×</button>
        </div>
  
        <div class="modal-body">
          <!-- Shared Filters -->
          <label>Min Nights: <input type="number" bind:value={minimum_nights} min="1" /></label>
          <label>Min Price: <input type="number" bind:value={min_price} min="0" /></label>
          <label>Max Price: <input type="number" bind:value={max_price} min="0" /></label>
  
          {#if mode === 'tourist'}
            <label>Accommodates: <input type="number" bind:value={accommodates} min="1" /></label>
            <label>Room Type : <input type="number" bind:value={room_type_code} /></label>
            <label>Review Score: <input type="range" min="0" max="5" step="0.1" bind:value={review_scores_rating} /></label>
            <label><input type="checkbox" bind:checked={host_is_superhost} /> Superhost Only</label>
            <label><input type="checkbox" bind:checked={instant_bookable} /> Instant Bookable</label>
          {:else}
            <label>Min Occupancy (0–1): <input type="number" step="0.01" min="0" max="1" bind:value={min_occupancy} /></label>
            <label>Property Type Code: <input type="number" bind:value={property_type_code} /></label>
          {/if}
        </div>
  
        <div class="modal-footer">
          <button on:click={fetchRecommendations}>Get Recommendations</button>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      width: 90%;
      max-width: 500px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .close-button {
      background: transparent;
      font-size: 1.5rem;
      border: none;
      cursor: pointer;
    }
    .modal-body label {
      display: block;
      margin-top: 1rem;
    }
    .modal-footer {
      margin-top: 1.5rem;
      text-align: right;
    }
  </style>
  