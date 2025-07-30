<script lang="ts">
  export let neighborhoods: {
    name: string;
    photoUrl: string;
    sentimentScore: number;
    totalReviews: number;
    startingPrice: number;
    instantBookablePercent: number;
  }[] = [];

  function safeFixed(val: number | undefined, digits = 0, suffix = "") {
    return val != null ? `${val.toFixed(digits)}${suffix}` : "N/A";
  }

  // Card carousel state
  let startIndex = 0;
  const cardsToShow = 3;

  function prev() {
    if (startIndex > 0) startIndex -= 1;
  }
  function next() {
    if (startIndex < neighborhoods.length - cardsToShow) startIndex += 1;
  }
</script>

<div class="carousel-container">
  <button
    class="arrow-btn left"
    on:click={prev}
    aria-label="Scroll left"
    disabled={startIndex === 0}>&#8592;</button
  >

  <div class="carousel-track">
    {#each neighborhoods.slice(startIndex, startIndex + cardsToShow) as nhood (nhood.name)}
      <div class="carousel-card">
        <!-- <img class="card-image" src={nhood.photoUrl} alt={`Photo of ${nhood.name}`} loading="lazy" /> -->
        <h2 class="card-header" title={nhood.name}>{nhood.name}</h2>
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
              >{safeFixed(nhood.instantBookablePercent, 0, "%")}%</span
            >
          </div>
        </div>
      </div>
    {/each}
  </div>

  <button
    class="arrow-btn right"
    on:click={next}
    aria-label="Scroll right"
    disabled={startIndex >= neighborhoods.length - cardsToShow}>&#8594;</button
  >
</div>

<style>
  .carousel-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    width: 100%;
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
  .arrow-btn:hover:not(:disabled) {
    background: #f0f2f7;
    color: #223;
    opacity: 1;
  }
  .arrow-btn:disabled {
    opacity: 0.2;
    cursor: default;
    pointer-events: none;
  }

  .carousel-track {
    display: flex;
    flex-direction: row;
    gap: 1.4rem;
    width: 100%;
    overflow: hidden;
    flex: 1 1 0;
    min-width: 0;
  }

  .carousel-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
    font-family: "Inter", sans-serif;
    min-width: 320px;
    max-width: 340px;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
