<script lang="ts">
    export let label: string;
    export let value: number | string;
    export let subtext: string = "";
  </script>
  
  <div class="tile-card">
    <h2 class="tile-value">{value}</h2>
    <p class="tile-label">{label}</p>
    {#if subtext}
      <p class="tile-subtext">{subtext}</p>
    {/if}
  </div>
  
  <style>
    .tile-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
  
    .tile-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0;
      color: #1e3a8a; /* Indigo-800 */
    }
  
    .tile-label {
      font-size: 1.1rem;
      font-weight: 500;
      color: #333;
      margin: 0.3rem 0;
    }
  
    .tile-subtext {
      font-size: 0.85rem;
      color: #666;
    }
  </style>
  