<script lang="ts">
  import { base } from "$app/paths";

  export let neighborhoods: {
    neighborhood: string;
    photoUrl: string;
    sentimentScore: number;
    totalReviews: number;
    startingPrice: number;
    percentInstantBookable: number;
  }[] = [];

  let scrollContainer: HTMLDivElement;

  function safeFixed(val: number | undefined, digits = 0, suffix = "") {
    return val != null ? `${val.toFixed(digits)}${suffix}` : "N/A";
  }

  // Scroll functions fixed to account for card width + gap
  function scrollNext() {
    if (!scrollContainer) return;
    const card = scrollContainer.querySelector<HTMLElement>(".carousel-card");
    if (!card) return;
    const style = getComputedStyle(scrollContainer);
    const gap = parseInt(style.columnGap) || 16; // fallback if columnGap not set
    const scrollAmount = card.offsetWidth + gap;
    scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
  }

  function scrollPrev() {
    if (!scrollContainer) return;
    const card = scrollContainer.querySelector<HTMLElement>(".carousel-card");
    if (!card) return;
    const style = getComputedStyle(scrollContainer);
    const gap = parseInt(style.columnGap) || 16;
    const scrollAmount = card.offsetWidth + gap;
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
  }
</script>

<div class="carousel-container">
  <button class="arrow-btn left" on:click={scrollPrev} aria-label="Scroll left"
    >‹</button
  >

  <div class="carousel-track" bind:this={scrollContainer}>
    {#each neighborhoods as nhood, index (nhood.neighborhood)}
      <div class="carousel-card">
        <img
          class="card-image"
          src={`${base}/${nhood.neighborhood}.jpg`}
          alt={`Photo of ${nhood.neighborhood}`}
          loading="lazy"
          on:error={(e) =>
            (e.currentTarget.src = `${base}/${nhood.neighborhood}.jpeg`)}
        />
        <h2 class="card-header" title={nhood.neighborhood}>
          <span class="card-rank">{index + 1}.</span>
          {nhood.neighborhood}
        </h2>
        <div class="metrics-grid">
          <div class="metric-pill" style="background-color: #dbeafe;">
            <div class="metric-label-line">
              <span class="metric-icon">😊</span>
              <span class="metric-label">Sentiment Score </span>
            </div>
            <span class="metric-value"
              >{safeFixed(nhood.sentimentScore, 2)}/5</span
            >
          </div>
          <div class="metric-pill" style="background-color: #bfdbfe;">
            <div class="metric-label-line">
              <span class="metric-icon">📝</span>
              <span class="metric-label">Reviews </span>
            </div>
            <span class="metric-value"
              >{nhood.totalReviews?.toLocaleString() ?? "N/A"}</span
            >
          </div>
          <div class="metric-pill" style="background-color: #93c5fd;">
            <div class="metric-label-line">
              <span class="metric-icon">💶</span>
              <span class="metric-label">Starting Price </span>
            </div>
            <span class="metric-value">${safeFixed(nhood.startingPrice)}</span>
          </div>
          <div class="metric-pill" style="background-color: #60a5fa;">
            <div class="metric-label-line">
              <span class="metric-icon">⚡</span>
              <span class="metric-label">Instant Bookable </span>
            </div>
            <span class="metric-value"
              >{safeFixed(nhood.percentInstantBookable, 0)}%</span
            >
          </div>
        </div>
      </div>
    {/each}
  </div>

  <button
    class="arrow-btn right"
    on:click={scrollNext}
    aria-label="Scroll right">›</button
  >
</div>

<style>
  .carousel-container {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%; /* inherits 500px from chart-container */
  }

  .carousel-track {
    display: flex;
    flex: 1;
    height: 100%;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    gap: 1rem;
    scrollbar-width: none;
  }

  .carousel-track::-webkit-scrollbar {
    display: none;
  }

  .arrow-btn {
    border: none;
    background: none;
    color: #888;
    font-size: 2rem;
    padding: 0.35rem 0.6rem;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0.68;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .carousel-card {
    flex: 0 0 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    scroll-snap-align: start;
    background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
  }

  .card-image {
    width: 100%;
    height: 60%;
    object-fit: cover;
  }

  .card-header {
    font-weight: 700;
    font-size: 1.3rem;
    margin: 0.8rem 1rem 0.4rem 1rem;
    color: #1a1a1a;
  }

  .card-rank {
    font-weight: 700;
    margin-right: 0.5rem;
    color: #60a5fa; /* light blue */
  }

  .metrics-grid {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem 1rem; /* a little more vertical spacing */
    padding: 0 1rem 1.2rem 1rem; /* bottom padding slightly increased */
  }

  .metric-label-line {
    display: flex;
    align-items: center;
    margin-bottom: 0.15rem;
  }

  .metric-label {
    display: flex;
    align-items: center;
    font-weight: 600;
    color: #1e3a8a; /* dark blue */
    font-size: 0.93rem;
  }

  .metric-icon {
    margin-right: 0.3rem;
    color: #2563eb; /* medium blue for icons */
  }

  .metric-value {
    font-weight: 700;
    color: #1a1a1a; /* dark neutral for values */
    font-size: 1.05rem;
  }
</style>
