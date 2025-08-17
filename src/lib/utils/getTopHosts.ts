// export function getTopHosts(listings: any[], topN = 5) {
//     const hostMap = new Map<string | number, any>();
  
//     for (const listing of listings) {
//       const hostId = listing.host_id;
//       const price = parseFloat((listing.price || '').replace(/[^\d.]/g, '')) || 0;
//       const revenue = parseFloat(listing.estimated_revenue_l365d) || 0;
//       const occupancy = parseFloat(listing.estimated_occupancy_l365d) || 0;
//       const host_url = listing.host_url;

//       if (!hostMap.has(hostId)) {
//         hostMap.set(hostId, {
//           host_id: hostId,
//           host_name: listing.host_name || '',
//           host_is_superhost: listing.host_is_superhost === 't' || listing.host_is_superhost === true,
//           host_since: listing.host_since || '',
//           total_revenue: 0,
//           total_occupancy: 0,
//           listings: 0,
//           price_min: price,
//           price_max: price,
//           host_url: host_url
//         });
//       }
  
//       const host = hostMap.get(hostId);
//       host.total_revenue += revenue;
//       host.total_occupancy += occupancy;
//       host.listings += 1;
//       host.price_min = Math.min(host.price_min, price);
//       host.price_max = Math.max(host.price_max, price);
//       host.host_url = host_url;
//     }
  
//     const topHosts = Array.from(hostMap.values())
//       .map(h => ({
//         host_id: h.host_id,
//         host_name: h.host_name,
//         host_is_superhost: h.host_is_superhost,
//         host_since: h.host_since,
//         estimated_revenue_l365d: Math.round(h.total_revenue),
//         calculated_host_listings_count: h.listings,
//         estimated_occupancy_l365d: h.listings > 0 ? Math.round(h.total_occupancy / h.listings) : 0,
//         price_min: Math.round(h.price_min),
//         price_max: Math.round(h.price_max),
//         host_url: h.host_url
//       }))
//       .sort((a, b) => b.estimated_revenue_l365d - a.estimated_revenue_l365d)
//       .slice(0, topN);
  
//     return topHosts;
//   }
  


export function getTopHosts(listings: any[], topN = 5) {
  const hostMap = new Map<string, any>();

  for (const listing of listings) {
    const hostAbout = listing.host_about || `__missing_${listing.host_id}`;
    const price = parseFloat((listing.price || '').replace(/[^\d.]/g, '')) || 0;
    const revenue = parseFloat(listing.estimated_revenue_l365d) || 0;
    const occupancy = parseFloat(listing.estimated_occupancy_l365d) || 0;
    const availability =
    !isNaN(Number(listing.availability_365)) ? Number(listing.availability_365) :
    !isNaN(Number(listing.availability_eoy)) ? Number(listing.availability_eoy) :
    0;
    const hostUrl = listing.host_url;
    const hostSince = listing.host_since ? new Date(listing.host_since) : null;

    if (!hostMap.has(hostAbout)) {
      hostMap.set(hostAbout, {
        host_ids: new Set([listing.host_id]),
        host_name: listing.host_name || '',
        host_is_superhost: listing.host_is_superhost === 't' || listing.host_is_superhost === true,
        host_since: hostSince,
        total_revenue: 0,
        total_occupancy: 0,
        total_available: 0, // sum of availability_365
        listings: 0,
        price_min: price,
        price_max: price,
        // track earliest and latest URLs separately
        earliest: hostSince ? { date: hostSince, url: hostUrl } : null,
        latest: { date: hostSince || new Date(0), url: hostUrl }
      });
    }

    const host = hostMap.get(hostAbout);

    host.host_ids.add(listing.host_id);
    host.total_revenue += revenue;
    host.total_occupancy += occupancy;
    host.total_available += availability;
    host.listings += 1;
    host.price_min = Math.min(host.price_min, price);
    host.price_max = Math.max(host.price_max, price);

    // Track earliest host_since (if valid)
    if (hostSince) {
      if (!host.earliest || hostSince < host.earliest.date) {
        host.earliest = { date: hostSince, url: hostUrl };
      }
    }

    // Always update latest (fallback if no earliest)
    if (!host.latest || !host.latest.date || (hostSince && hostSince > host.latest.date)) {
      host.latest = { date: hostSince || new Date(0), url: hostUrl };
    }

    // If any account is superhost, mark as true
    if (listing.host_is_superhost === 't' || listing.host_is_superhost === true) {
      host.host_is_superhost = true;
    }
  }

  const topHosts = Array.from(hostMap.values())
    .map(h => {
      const chosen = h.earliest || h.latest; // prefer earliest if available, else latest

      const occupancyPercent = h.total_available > 0
      ? Math.round((h.total_occupancy / h.total_available) * 100)
      : 0;

    // Log if occupancyPercent is NaN
    if (isNaN(occupancyPercent)) {
      console.error("NaN detected for host!", {
        host_about: chosen ? chosen.url : 'unknown',
        total_occupancy: h.total_occupancy,
        total_available: h.total_available,
        host_ids: Array.from(h.host_ids),
      });
    }
      return {
        host_ids: Array.from(h.host_ids),
        host_name: h.host_name,
        host_is_superhost: h.host_is_superhost,
        host_since: chosen.date ? chosen.date.toISOString().split('T')[0] : '',
        estimated_revenue_l365d: Math.round(h.total_revenue),
        calculated_host_listings_count: h.listings,
        estimated_occupancy_percent: isNaN(occupancyPercent) ? 0 : Math.round(occupancyPercent),
        price_min: Math.round(h.price_min),
        price_max: Math.round(h.price_max),
        host_url: chosen.url
      };
    })
    .sort((a, b) => b.estimated_revenue_l365d - a.estimated_revenue_l365d)
    .slice(0, topN);

  
  return topHosts;
}
