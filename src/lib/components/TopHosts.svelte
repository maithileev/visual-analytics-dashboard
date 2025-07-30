<script lang="ts">
    export let topHosts: {
        host_name: string;
        estimated_revenue_l365d: number;
        calculated_host_listings_count: number;
        estimated_occupancy_l365d: number;
        price_min: number;
        price_max: number;
        host_is_superhost: boolean;
        host_id: string | number;
        host_since: string;
    }[] = [];
</script>

<div class="container" role="list" aria-label="Top earning hosts pyramid">
    {#each topHosts.slice(0, 5) as host (host.host_id)}
        <div
            class="tile"
            role="listitem"
            aria-label={`Host details for ${host.host_name}`}
        >
            <div class="tile-header" title={host.host_name}>
                <span>{host.host_name}</span>
            </div>
            <div class="stat-row">
                <span class="label">💰 Revenue:</span>
                <span class="value"
                    >${host.estimated_revenue_l365d.toLocaleString()}</span
                >
            </div>
            <div class="stat-row">
                <span class="label">🛏️ Listings:</span>
                <span class="value">{host.calculated_host_listings_count}</span>
            </div>
            <div class="stat-row">
                <span class="label">💡 Occupancy:</span>
                <span class="value">{host.estimated_occupancy_l365d}%</span>
            </div>
            <div class="stat-row">
                <span class="label">🏷️ Price:</span>
                <span class="value">${host.price_min} – ${host.price_max}</span>
            </div>
            <div class="stat-row">
                <span class="label">Host Since:</span>
                <span class="value">{host.host_since}</span>
            </div>

            <div class="stat-row">
                {#if host.host_is_superhost}
                    <span class="superhost-badge" aria-label="Superhost badge"
                        >⭐ Superhost</span
                    >
                {/if}
            </div>
        </div>
    {/each}
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");

    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem 1.5rem;
        width: 100%;
        padding: 1.5rem 2rem;
        box-sizing: border-box;
        background: #f7fafc;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        justify-items: center;
        align-items: start;
    }

    .tile {
        background: #fff;
        box-shadow: 0 4px 20px rgba(34, 42, 73, 0.08);
        border-radius: 14px;
        padding: 1.2rem 1.5rem 1.1rem 1.5rem;
        font-size: 1rem;
        color: #223;
        min-width: 0;
        min-height: 290px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
        transition: box-shadow 0.13s;
        overflow-wrap: break-word;
        word-break: break-word;
    }

    .tile:hover {
        box-shadow: 0 6px 24px rgba(34, 42, 73, 0.12);
    }

    .tile-header {
        font-weight: 700;
        font-size: 1.1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        margin-bottom: 0.3rem;
        line-height: 1.1;
    }

    .value {
        font-weight: 600;
        font-size: 0.95rem; /* slightly smaller */
        color: #2d3a4b;
        white-space: nowrap; /* keep on single line */
        overflow: hidden;
        text-overflow: ellipsis; /* show "..." if too long */
        max-width: 100%;
    }

    .stat-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 0.6rem;
        padding: 0.2rem 0;    /* add vertical padding inside each stat row */
        line-height: 1.3;
    }

    .label {
        font-weight: 500;
        color: #7b8ca0;
        min-width: 78px;
        font-size: 0.96rem;
        letter-spacing: 0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        margin: 0;
        line-height: 1.1;
    }

    /* .value {
        font-weight: 600;
        font-size: 1.04rem;
        color: #2d3a4b;
        line-height: 1.22;
        word-break: break-word;
        max-width: calc(100% - 78px);
        overflow-wrap: anywhere;
    } */

    .superhost-badge {
        background: linear-gradient(90deg, #36c47d, #2dbe6b 95%);
        color: #fff;
        font-weight: 600;
        font-size: 0.87rem;
        padding: 0.24rem 0.8rem;
        border-radius: 8px;
        margin-top: 0.2rem;
        user-select: none;
        letter-spacing: 0.01em;
        box-shadow: 0 2px 6px rgba(39, 174, 96, 0.05);
        flex-shrink: 0;
    }

    @media (max-width: 900px) {
        .container {
            grid-template-columns: 1fr;
        }
        .tile {
            min-height: 235px;
        }
    }
</style>
