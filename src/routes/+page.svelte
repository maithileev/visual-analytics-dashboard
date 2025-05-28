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
    import { onMount } from 'svelte';
  
    let mapContainer: HTMLDivElement;
  
    onMount(async () => {
      if (!mapContainer) return;
  
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
  
      const bounds = L.latLngBounds(
        [40.80, 14.20],  // Southwest corner (approx)
        [40.90, 14.35]   // Northeast corner (approx)
      );

      const map = L.map(mapContainer, {
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
        minZoom: 13,
        maxZoom: 16
      }).setView([40.8522, 14.2681], 14);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    });
  </script>
  
  <div bind:this={mapContainer} style="height:400px; width:100%; border-radius:8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);"></div>
    