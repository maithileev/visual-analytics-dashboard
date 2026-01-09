     <script lang="ts">
      import { base } from '$app/paths';
    </script>
    
    <section class="home">
      <div class="card hero">
        <div class="hero-accent" aria-hidden="true"></div>
    
        <div class="hero-content">
          <h2 class="title">Welcome to Smart Stays</h2>
          <p class="subtitle">
            Choosing a place to stay — or deciding whether a rental is worth investing in — usually means juggling a few things at once:
            price, ratings, availability, location, and (for investors) performance signals.
          </p>
          <p class="subtitle">
            The dashboard is interactive: <strong>click a neighborhood on the map</strong> and the KPIs + charts update to show how that
            area compares to the overall city.
          </p>
    
          <div class="chips" aria-label="Key interactions">
            <span class="chip">🗺️ Click neighborhoods</span>
            <span class="chip">📊 KPIs & charts update</span>
            <span class="chip">🖱️ Hover for details</span>
          </div>
    
        </div>
      </div>
    
      <div class="card callout">
        <div class="callout-icon" aria-hidden="true">👆</div>
        <div>
          <h3 class="callout-title">Neighborhood comparison is the core interaction</h3>
          <p class="callout-text">
            Click a neighborhood on the map to filter the view. The KPI tiles and charts update instantly, making it easy to compare areas.
          </p>
        </div>
      </div>
    
      <div class="grid">
        <div class="card panel">
          <div class="panel-inner">
            <div>
              <span class="badge">Tourist</span>
              <h3 class="panel-title">Where should I stay?</h3>
              <p class="panel-text">
                Use this view to compare neighborhoods based on what travelers usually care about — price, ratings, and availability.
              </p>
    
              <ul class="list">
                <li>Typical prices and guest ratings</li>
                <li>Room / property type mix</li>
                <li>Availability patterns across the city</li>
              </ul>
            </div>
    
            <a class="btn full" href="{base}/tourist">
              Go to Tourist Dashboard →
            </a>
          </div>
        </div>
    
        <div class="card panel">
          <div class="panel-inner">
            <div>
              <span class="badge">Investor</span>
              <h3 class="panel-title">Is it worth investing?</h3>
              <p class="panel-text">
                Use this view to explore performance signals for short-term rentals — occupancy, revenue estimates, and licensing indicators.
              </p>
    
              <ul class="list">
                <li>Occupancy and minimum night requirements</li>
                <li>Estimated revenue indicators</li>
                <li>Licensing / hosting patterns by neighborhood</li>
              </ul>
            </div>
    
            <a class="btn full" href="{base}/investor">
              Go to Investor Dashboard →
            </a>
          </div>
        </div>
      </div>
    
      <div class="lower">
        <div class="card panel">
          <div class="panel-inner no-button">
            <div>
              <h3 class="panel-title">How to use the dashboard</h3>
              <ol class="steps">
                <li>Pick a perspective (Tourist or Investor).</li>
                <li>Click a neighborhood on the map to filter the view.</li>
                <li>Use the KPIs and charts to compare the selected area against the city overview.</li>
              </ol>
            </div>
          </div>
        </div>
    
        <div class="card panel">
          <div class="panel-inner no-button">
            <div>
              <h3 class="panel-title">About this project</h3>
              <p class="panel-text">
                This dashboard was built as a learning project in visual analytics. The focus is on coordinated views and interactions
                that support exploration and comparison, rather than static reporting.
              </p>
              <p class="panel-text muted">
                The design evolved through iteration and small refinements — feedback is always welcome.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <style>
      .home {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0.75rem 0 2.25rem;
      }
    
      .card {
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }
    
      .hero {
        position: relative;
        margin-bottom: 1rem;
      }
    
      .hero-accent {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(900px 240px at 10% 10%, rgba(30, 64, 175, 0.18), transparent 60%),
          radial-gradient(700px 220px at 90% 25%, rgba(0, 119, 204, 0.12), transparent 55%);
        pointer-events: none;
      }
    
      .hero-content {
        position: relative;
        padding: 1.6rem;
      }
    
      .title {
        font-size: 2rem;
        font-weight: 850;
        margin: 0 0 0.55rem;
        letter-spacing: -0.01em;
      }
    
      .subtitle {
        margin: 0.35rem 0;
        color: rgba(0, 0, 0, 0.72);
        line-height: 1.55;
        max-width: 85ch;
      }
    
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.85rem;
      }
    
      .chip {
        display: inline-flex;
        align-items: center;
        padding: 0.34rem 0.6rem;
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 650;
        color: rgba(0, 0, 0, 0.7);
        background: rgba(0, 119, 204, 0.08);
        border: 1px solid rgba(0, 119, 204, 0.18);
      }
    
      .hint {
        margin: 0.7rem 0 0;
        font-size: 0.92rem;
        color: rgba(0, 0, 0, 0.6);
      }
    
      .callout {
        display: flex;
        gap: 0.85rem;
        align-items: flex-start;
        padding: 1rem 1.1rem;
        margin-bottom: 1rem;
      }
    
      .callout-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(0, 119, 204, 0.10);
        border: 1px solid rgba(0, 119, 204, 0.18);
        font-size: 1.1rem;
        flex: 0 0 auto;
      }
    
      .callout-title {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 800;
      }
    
      .callout-text {
        margin: 0.25rem 0 0;
        color: rgba(0, 0, 0, 0.7);
        line-height: 1.5;
      }
    
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        margin: 0.9rem 0 1rem;
      }
    
      @media (min-width: 900px) {
        .grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    
      .panel {
        padding: 1.25rem;
      }
    
      .panel-inner {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.85rem;
      }
    
      .panel-inner.no-button {
        gap: 0.6rem;
      }
    
      .badge {
        display: inline-flex;
        padding: 0.28rem 0.6rem;
        border-radius: 999px;
        font-size: 0.82rem;
        font-weight: 800;
        background: rgba(0, 119, 204, 0.08);
        border: 1px solid rgba(0, 119, 204, 0.18);
        color: rgba(0, 0, 0, 0.72);
        margin-bottom: 0.55rem;
      }
    
      .panel-title {
        margin: 0;
        font-size: 1.18rem;
        font-weight: 850;
      }
    
      .panel-text {
        margin: 0.4rem 0 0;
        color: rgba(0, 0, 0, 0.72);
        line-height: 1.55;
      }
    
      .panel-text.muted {
        color: rgba(0, 0, 0, 0.58);
      }
    
      .list {
        margin: 0.85rem 0 0.25rem;
        padding-left: 1.15rem;
        color: rgba(0, 0, 0, 0.72);
      }
    
      .list li {
        margin: 0.28rem 0;
        line-height: 1.5;
      }
    
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.7rem 1rem;
        border-radius: 10px;
        border: none;
        background-color: #0077cc;
        color: #ffffff;
        text-decoration: none;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s ease;
        box-sizing: border-box;
        margin-top: auto;
      }
    
      .btn:hover {
        background-color: #005fa3;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.18);
        transform: translateY(-1px);
      }
    
      .btn:active {
        background-color: #004080;
        transform: translateY(0);
      }
    
      .btn.full {
        width: 100%;
        max-width: 100%;
      }
    
      .lower {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
        margin-top: 1rem;
      }
    
      @media (min-width: 900px) {
        .lower {
          grid-template-columns: 1fr 1fr;
        }
      }
    
      .steps {
        margin: 0.6rem 0 0;
        padding-left: 1.2rem;
        color: rgba(0, 0, 0, 0.72);
      }
    
      .steps li {
        margin: 0.45rem 0;
        line-height: 1.5;
      }
    </style>
        