<script>
    import { currentTab } from '$lib/stores';
  </script>
  
  <nav class="tabs">
    <button
      class:selected={$currentTab === 'overview'}
      on:click={() => currentTab.set('overview')}
    >Overview</button>
    <button 
      class:selected={$currentTab === 'tourist'}
      on:click={() => currentTab.set('tourist')}
    >Tourist</button>
    <button 
      class:selected={$currentTab === 'investor'}
      on:click={() => currentTab.set('investor')}
    >Investor</button>
  </nav>
  
  <style>
    .tabs {
      display: flex;
      gap: 1.5rem;
      background: white;
      padding: 0.75rem 1rem;
      border-bottom: 2px solid #0077cc;
      user-select: none;
    }
  
    .tabs button {
      background: transparent;
      border: none;
      padding: 0.5rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: #0077cc;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.3s ease;
      border-radius: 0.25rem 0.25rem 0 0;
    }
  
    .tabs button:hover {
      color: #005fa3;
    }
  
    .tabs button.selected {
      color: #003d66;
      border-bottom-color: #003d66;
      font-weight: 700;
    }
  </style>
  