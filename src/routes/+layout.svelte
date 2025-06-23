<script>
    import '../global.css';
</script>
  
  <style>
    .full-vh {
      height: calc(var(--vh, 1vh) * 100);
      min-height: calc(var(--vh, 1vh) * 100);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
  
    :global(html, body) {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
    }
  
    header, footer {
      background-color: #0077cc;
      color: white;
      padding: 1rem 2rem;
      flex-shrink: 0;
    }
  
    .filters {
      background-color: white;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin: 1rem 2rem;
    }
  </style>
  
  <div class="full-vh">
    <header>
      <h1>Smart Stays: Naples Airbnb Analytics</h1>
    </header>
  
    <section class="filters">
      <slot name="filters">
        <p class="text-sm text-gray-600">[Filters go here]</p>
      </slot>
    </section>
  
    <main style="flex-grow:1; padding: 1rem 2rem; overflow-y: auto;">
      <slot />
    </main>
  
    <footer>
      <p>© 2025 Maithilee Vaidya — bringing data to life, fueled by curiosity and caffeine ☕️</p>
    </footer>
  </div>
  