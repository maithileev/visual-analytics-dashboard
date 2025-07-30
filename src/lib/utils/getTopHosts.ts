export function getTopHosts(listings: any[], topN = 5) {
    const hostMap = new Map<string | number, any>();
  
    for (const listing of listings) {
      const hostId = listing.host_id;
      const price = parseFloat((listing.price || '').replace(/[^\d.]/g, '')) || 0;
      const revenue = parseFloat(listing.estimated_revenue_l365d) || 0;
      const occupancy = parseFloat(listing.estimated_occupancy_l365d) || 0;
  
      if (!hostMap.has(hostId)) {
        hostMap.set(hostId, {
          host_id: hostId,
          host_name: listing.host_name || '',
          host_is_superhost: listing.host_is_superhost === 't' || listing.host_is_superhost === true,
          host_since: listing.host_since || '',
          total_revenue: 0,
          total_occupancy: 0,
          listings: 0,
          price_min: price,
          price_max: price
        });
      }
  
      const host = hostMap.get(hostId);
      host.total_revenue += revenue;
      host.total_occupancy += occupancy;
      host.listings += 1;
      host.price_min = Math.min(host.price_min, price);
      host.price_max = Math.max(host.price_max, price);
    }
  
    const topHosts = Array.from(hostMap.values())
      .map(h => ({
        host_id: h.host_id,
        host_name: h.host_name,
        host_is_superhost: h.host_is_superhost,
        host_since: h.host_since,
        estimated_revenue_l365d: Math.round(h.total_revenue),
        calculated_host_listings_count: h.listings,
        estimated_occupancy_l365d: h.listings > 0 ? Math.round(h.total_occupancy / h.listings) : 0,
        price_min: Math.round(h.price_min),
        price_max: Math.round(h.price_max)
      }))
      .sort((a, b) => b.estimated_revenue_l365d - a.estimated_revenue_l365d)
      .slice(0, topN);
  
    return topHosts;
  }
  