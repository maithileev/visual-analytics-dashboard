  <script lang="ts">
    import '../global.css';
    import Tabs from '$lib/components/Tabs.svelte';
    import { currentTab } from '$lib/stores';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { selectedNeighborhood } from '$lib/stores/selectedNeighborhood';
    import RecommendationModal from '$lib/components/RecommendationModal.svelte';

    let showRecoModal = false;
    let mode: 'tourist' | 'investor' | '' = '';

    $: isHome = $page.url.pathname === base || $page.url.pathname === base + '/';

  function openRecoModal() {
    const path = $page.url.pathname;
    if (path.includes('/tourist')) mode = 'tourist';
    else if (path.includes('/investor')) mode = 'investor';
    else return;
    showRecoModal = true;
  }

  // function handleRecommendations(e) {
  //   console.log("Recommended IDs:", e.detail.ids);
  // }

  $: {
    selectedNeighborhood.set(null);
  }

  </script>
  
  <div class="full-vh">
    <header>
      <h1>Smart Stays: Naples Airbnb Analytics</h1>
    </header>

    {#if !isHome}
      <nav class="nav-tabs">
        <div class="tab-links">
          <a href="{base}/" class:selected={isHome}>Home</a>
          <a href="{base}/tourist" class:selected={$page.url.pathname === base + '/tourist'}>Tourist</a>
          <a href="{base}/investor" class:selected={$page.url.pathname === base + '/investor'}>Investor</a>
        </div>
        <button class="reco-button" on:click={openRecoModal}>Recommendations</button>
      </nav>
      {/if}

        
{#if showRecoModal && mode}
<RecommendationModal
  open={showRecoModal}
  mode={mode}
  on:close={() => showRecoModal = false}
  on:recommendations={handleRecommendations}
/>
{/if}

    <main style="flex-grow:1; padding: 1rem 2rem; overflow-y: auto;">
      <slot />
    </main>
  
    <footer>
      <p>© 2025 Maithilee Vaidya — bringing data to life, fueled by curiosity and caffeine ☕️</p>
    </footer>
  </div>
  