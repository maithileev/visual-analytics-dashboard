<script lang="ts">
  export let neighborhoods: {
    neighborhood: string;
    photoUrl: string;
    sentimentScore: number;
    totalReviews: number;
    startingPrice: number;
    percentInstantBookable: number;
  }[] = [];

  let scrollContainer: HTMLDivElement;

function scrollNext() {
  if (!scrollContainer) return;
  scrollContainer.scrollBy({ left: scrollContainer.clientWidth, behavior: 'smooth' });
}

function scrollPrev() {
  if (!scrollContainer) return;
  scrollContainer.scrollBy({ left: -scrollContainer.clientWidth, behavior: 'smooth' });
}
  function safeFixed(val: number | undefined, digits = 0, suffix = "") {
    return val != null ? `${val.toFixed(digits)}${suffix}` : "N/A";
  }

  // Card carousel state
  let startIndex = 0;
  const cardsToShow = 1;

  function prev() {
    if (startIndex > 0) startIndex -= 1;
  }
  function next() {
    if (startIndex < neighborhoods.length - cardsToShow) startIndex += 1;
  }
</script>

<div class="carousel-container">

  <div class="carousel-container">
    <button class="arrow-btn left" on:click={scrollPrev} aria-label="Scroll left">‹</button>
  
  <div class="carousel-track">
    {#each neighborhoods.slice(startIndex, startIndex + cardsToShow) as nhood (nhood.neighborhood)}
      
    <div class="carousel-track" bind:this={scrollContainer}>
      {#each neighborhoods as nhood (nhood.neighborhood)}
  <div class="carousel-card">
        <!-- <img class="card-image" src={nhood.photoUrl} alt={`Photo of ${nhood.name}`} loading="lazy" /> -->
        <h2 class="card-header" title={nhood.neighborhood}>{nhood.neighborhood}</h2>
        <div class="metrics-grid">
          <div>
            <span class="metric-label">😊 Sentiment</span>
            <span class="metric-value"
              >{safeFixed(nhood.sentimentScore, 2)}</span
            >
          </div>
          <div>
            <span class="metric-label">📝 Reviews</span>
            <span class="metric-value"
              >{nhood.totalReviews?.toLocaleString() ?? "N/A"}</span
            >
          </div>
          <div>
            <span class="metric-label">💰 Price</span>
            <span class="metric-value">${safeFixed(nhood.startingPrice)}</span>
          </div>
          <div>
            <span class="metric-label">⚡ Instant</span>
            <span class="metric-value"
              >{safeFixed(nhood.percentInstantBookable, 0)}%</span
            >
          </div>
        </div>
      </div>
    {/each}
  </div>
  {/each}
  </div>
  <button class="arrow-btn right" on:click={scrollNext} aria-label="Scroll right">›</button>
</div>

</div>

<style>
  .carousel-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
  }
  .carousel-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scroll-padding-left: 0; /* align cards nicely */
  flex: 1 1 auto;
  gap: 1rem;
  scrollbar-width: none; /* Firefox */
}

.carousel-track::-webkit-scrollbar {
  display: none; /* Chrome */
}


  .arrow-btn {
    border: none;
    background: none;
    color: #888;
    font-size: 2rem;
    padding: 0.35rem 0.6rem;
    border-radius: 50%;
    transition:
      background 0.1s,
      color 0.1s;
    cursor: pointer;
    outline: none;
    min-width: 2.4rem;
    min-height: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.68;
  }

  .carousel-card {
    flex: 0 0 100%; /* make each card take full width of container */
    scroll-snap-align: start;
    box-sizing: border-box;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
    font-family: "Inter", sans-serif;
    min-width: 0;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: box-shadow 0.12s;
  }
  .carousel-card:hover {
    box-shadow: 0 6px 26px rgba(34, 42, 73, 0.12);
  }
  .card-image {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
  .card-header {
    font-weight: 700;
    font-size: 1.3rem;
    margin: 1rem 1.2rem 0.5rem 1.2rem;
    color: #1a1a1a;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }
  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem 1.1rem;
    padding: 0 1.2rem 1.2rem 1.2rem;
  }
  .metric-label {
    font-weight: 600;
    color: #5a6a85;
    font-size: 0.93rem;
    display: flex;
    align-items: center;
  }
  .metric-value {
    font-weight: 700;
    color: #222;
    font-size: 1.08rem;
    line-height: 1.18;
  }
</style>
