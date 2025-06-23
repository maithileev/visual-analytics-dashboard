<!-- 
   CODE for flip card
   --------------------------------------------------------
   <script lang="ts">
    let flipped: boolean = false;
  </script>
  
  <div class="card" on:click={() => (flipped = !flipped)}>
    <div class={`inner ${flipped ? 'flipped' : ''}`}>
      <div class="front">
        <h2>Revenue</h2>
        <p>$120,000</p>
      </div>
      <div class="back">
        <h2>Details</h2>
        <p>Growth: +12%<br />Compared to Q4: +5%</p>
      </div>
    </div>
  </div>
  
  <style>
    .card {
      width: 200px;
      height: 150px;
      perspective: 1000px;
      cursor: pointer;
    }
  
    .inner {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s ease-in-out;
    }
  
    .flipped {
      transform: rotateY(180deg);
    }
  
    .front,
    .back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 12px;
      border: 1px solid #ccc;
      background-color: white;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }
  
    .back {
      background-color: #e8f0fe;
      transform: rotateY(180deg);
    }
  </style>
   -->
   <script lang="ts">
    import AveragePrice from '$lib/components/AveragePrice.svelte';
    import SummaryTiles from '$lib/components/SummaryTiles.svelte';
    import Map from '$lib/components/Map.svelte';
    import type { PageData } from './$types';
  
    type PageData  = {
      geojson : any ;
      availableStays : number;
      averagePriceRounded : number;
      minPrice : number;
      maxPrice : number;
      averageRatingRounded: number;
    }
  
    export let data : PageData
    const totalStaysLabel = "Available Stays";
    const totalStaysSubtext = "Actively listed rentals across the city";
    const averagePriceSubtext = "What you might spend to stay here";
    const averageRatingSubtext = "Reflecting how guests rate their stays"
  </script>
  
  <section class="kpi-grid">
    <div class="bg-white p-4 rounded shadow">
      <SummaryTiles 
        value={data.availableStays} 
        label={totalStaysLabel} 
        subtext={totalStaysSubtext} />
    </div>
    <div class="bg-white p-4 rounded shadow">
      <SummaryTiles 
        value={data.averagePriceRounded} 
        label="Average Price per night" 
        subtext={averagePriceSubtext} />
    </div>
    <div class="bg-white p-4 rounded shadow">
      <SummaryTiles 
        value={data.averageRatingRounded}
        label="Average Rating" 
        subtext={averageRatingSubtext} />
    </div>
    <div class="bg-white p-4 rounded shadow">
      <AveragePrice 
        value= "TODO" 
        label="Price range" 
        subtext={averagePriceSubtext} />
    </div>

  </section>
  
  <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Left: Map  -->
    <div class="bg-white p-4 rounded shadow">
      <h2 class="text-lg font-semibold mb-2">Rental Distribution Map</h2>
      <Map geojson={data.geojson} />
    </div>
  
    <!-- Right: Charts -->
    <div class="space-y-4">
      <div class="bg-white p-4 rounded shadow">[Chart 1]</div>
      <div class="bg-white p-4 rounded shadow">[Chart 2]</div>
    </div>
  </section>  
  <div class="bg-white p-4 rounded shadow">
    <h2 class="text-lg font-semibold mb-2">Recommendations</h2>
  </div>

    
    
    
    