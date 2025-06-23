<script lang="ts">
    import { onMount } from 'svelte';
    export let geojson;
  
    let mapContainer;
  
    onMount(async () => {
      const L = await import('leaflet');
  
      const map = L.map(mapContainer);
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        opacity: 0.2 // to "dim" background, optional
      }).addTo(map);
  
      const geoLayer = L.geoJSON(geojson, {
        style: {
          color: '#00bcd4',
          weight: 2,
          fillColor: '#00bcd4',
          fillOpacity: 0.6
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(feature.properties.neighbourhood || 'Neighborhood');
        }
      }).addTo(map);
      const bounds = geoLayer.getBounds();
      map.fitBounds(bounds);
      map.setMaxBounds(bounds);
      map.setMinZoom(map.getZoom()); 

      map.fitBounds(geoLayer.getBounds());
    });
  </script>
  
  <style>
    .map {
      height: 100%;
      width: 50%;
      min-height: 400px;
    }
  </style>
  
  <div bind:this={mapContainer} class="map" > </div>
  