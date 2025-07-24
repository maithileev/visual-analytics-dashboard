  <script>
    import '../global.css';
    import Tabs from '$lib/components/Tabs.svelte';
    import { currentTab } from '$lib/stores';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { selectedNeighborhood } from '$lib/stores/selectedNeighborhood';
    $: {
    // Reset neighborhood selection on route change
    selectedNeighborhood.set(null);
  }

  </script>
  
  <div class="full-vh">
    <header>
      <h1>Smart Stays: Naples Airbnb Analytics</h1>
    </header>

    <nav class="nav-tabs">
      <!-- <a href="{base}/" class:selected={$page.url.pathname === base + '/'}>Overview</a> -->
      <a href="{base}/tourist" class:selected={$page.url.pathname === base + '/tourist'}>Tourist</a>
      <a href="{base}/investor" class:selected={$page.url.pathname === base + '/investor'}>Investor</a>
    </nav>
    
    <main style="flex-grow:1; padding: 1rem 2rem; overflow-y: auto;">
      <slot />
    </main>
  
    <footer>
      <p>© 2025 Maithilee Vaidya — bringing data to life, fueled by curiosity and caffeine ☕️</p>
    </footer>
  </div>
  