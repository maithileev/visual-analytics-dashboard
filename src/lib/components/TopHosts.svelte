<script lang="ts">
    export let topHosts: {
        host_name: string;
        estimated_revenue_l365d: number;
        calculated_host_listings_count: number;
        estimated_occupancy_percent: number; // days booked
        price_min: number;
        price_max: number;
        host_is_superhost: boolean;
        host_id: string | number;
        host_since: string;
        host_url: string;
    }[] = [];

    const formatCurrency = (value: number) =>
        value >= 1_000_000
            ? `$${(value / 1_000_000).toFixed(2)}M`
            : value >= 1_000
              ? `$${(value / 1_000).toFixed(1)}K`
              : `$${value}`;

    const formatPriceRange = (min: number, max: number) =>
        min === max
            ? formatCurrency(min)
            : `${formatCurrency(min)} – ${formatCurrency(max)}`;
    
    $: localTopHosts = [...topHosts];

    $: console.log("Top Hosts in svelte:", topHosts);

</script>

<div class="container" role="list" aria-label="Top earning hosts pyramid">
    {#each topHosts as host (host.host_name)}
        <div
            class="tile"
            role="listitem"
            aria-label={`Host details for ${host.host_name}`}
        >
            <div class="tile-content">
                <div class="tile-header" title={host.host_name}>
                    <span>{host.host_name}</span>
                </div>

                <div class="stat-row">
                    <span class="label label-revenue">Revenue:</span>
                    <span class="value"
                        >{formatCurrency(host.estimated_revenue_l365d)}</span
                    >
                </div>

                <div class="stat-row">
                    <span class="label label-listings">Listings:</span>
                    <span class="value"
                        >{host.calculated_host_listings_count}</span
                    >
                </div>

                <div
                    class="stat-row"
                    title={`${host.estimated_occupancy_percent} days booked`}
                >
                    <span class="label label-occupancy">Occupancy:</span>
                    <span class="value"
                        >{host.estimated_occupancy_percent}%</span
                    >
                </div>

                <div class="stat-row">
                    <span class="label label-price">Price:</span>
                    <span class="value"
                        >{formatPriceRange(
                            host.price_min,
                            host.price_max,
                        )}</span
                    >
                </div>

                <div class="stat-row host-since-row">
                    <span class="label label-host-since">Host Since:</span>
                    <span class="value">{host.host_since}</span>
                </div>

                <div class="stat-row">
                    <span
                        class="host-badge {host.host_is_superhost
                            ? 'superhost'
                            : 'not-superhost'}"
                        aria-label={host.host_is_superhost
                            ? "Superhost"
                            : "Not a Superhost"}
                    >
                        {host.host_is_superhost
                            ? "⭐ Superhost"
                            : "☆ Not Superhost"}
                    </span>
                </div>
            </div>
            <button
                on:click={() => window.open(host.host_url, "_blank")}
                class="learn-more-btn"
            >
                Learn More
            </button>
        </div>
    {/each}
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");

    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        column-gap: 1.5rem; 
        row-gap: 2rem; 
        width: 95%;
        padding: 1.5rem 2rem;
        font-family: "Inter", "Segoe UI", Arial, sans-serif;
        justify-items: stretch; 
        align-items: start;
    }

    .tile {
        background: #fff;
        box-shadow: 0 4px 20px rgba(34, 42, 73, 0.08);
        border-radius: 14px;
        padding: 1.2rem 1.5rem;
        color: #223;
        min-width: 0;
        min-height: 290px;
        display: flex;
        flex-direction: column;
        transition: box-shadow 0.13s;
    }

    .tile-content {
        flex: 1; 
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
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
        margin-bottom: 0.3rem;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.9rem;
        margin-bottom: 0.6rem;
    }

    .label {
        font-weight: 500;
        color: #7b8ca0;
        font-size: 0.96rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex-shrink: 0;
        margin-right: 0.5rem;
    }

    .value {
        font-weight: 600;
        font-size: 0.95rem;
        color: #2d3a4b;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex-shrink: 0; 
        text-align: left;
    }

    .host-since-row {
        gap: 0.2rem;
    }


    .learn-more-btn {
        background-color: #005fa3;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-size: 0.95rem;
        cursor: pointer;
        transition: background-color 0.3s ease;
        margin-top: auto;
    }

    .learn-more-btn:hover {
        background-color: #004a7c;
    }

    .host-badge {
        font-weight: 600;
        font-size: 0.87rem;
        padding: 0.3rem 0.9rem;
        border-radius: 12px;
        display: inline-block;
        text-align: center;
        min-width: 110px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }

    .superhost {
        background: linear-gradient(90deg, #36c47d, #2dbe6b 95%);
        color: #fff;
    }

    .not-superhost {
        background: linear-gradient(90deg, #e0a192, #d17a62 95%);
        color: #fff;
    }

    .superhost-badge {
        background: linear-gradient(90deg, #3ac47d, #28a745 95%);
        color: #fff;
        font-weight: 600;
        font-size: 0.87rem;
        padding: 0.24rem 0.8rem;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(39, 174, 96, 0.05);
    }

    @media (max-width: 900px) {
        .container {
            grid-template-columns: 1fr;
        }
        .tile {
            min-height: 235px;
        }
    }

    .label-revenue::before {
        content: "💶 ";
    }
    .label-listings::before {
        content: "🏠 ";
    }
    .label-occupancy::before {
        content: "📊 ";
    }
    .label-price::before {
        content: "💸 ";
    }
    .label-host-since::before {
        content: "📆 ";
    }
</style>