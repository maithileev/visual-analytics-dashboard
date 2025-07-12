// export function prepareBubbleChart(rows: any[]): {
//   label: string;
//   avg_price: number;
//   avg_rating: number;
//   count: number;
// }[] {
//   const neighborhoodMap = new Map<string, { totalPrice: number; totalRating: number; count: number }>();

//   rows.forEach((row) => {
//     const neighborhood = row.neighbourhood_cleansed;
//     const priceStr = (row.price || '').replace(/[^0-9.]/g, '');
//     const price = parseFloat(priceStr);
//     const rating = parseFloat(row.review_scores_rating || '');

//     if (!neighborhood || isNaN(price) || isNaN(rating)) return;

//     if (!neighborhoodMap.has(neighborhood)) {
//       neighborhoodMap.set(neighborhood, { totalPrice: 0, totalRating: 0, count: 0 });
//     }

//     const entry = neighborhoodMap.get(neighborhood)!;
//     entry.totalPrice += price;
//     entry.totalRating += rating;
//     entry.count += 1;
//   });

//   const bubbleData = Array.from(neighborhoodMap.entries()).map(([label, val]) => ({
//     label,
//     avg_price: parseFloat((val.totalPrice / val.count).toFixed(2)),
//     avg_rating: parseFloat((val.totalRating / val.count).toFixed(2)),
//     count: val.count
//   }));

//   return bubbleData;
// }


export function prepareBubbleChart(
  rows: any[],
  neighborhoodField: string = 'neighbourhood_cleansed',
  xField: string,
  yField: string = 'review_scores_rating', // default y is rating, can override
): {
  label: string;
  avg_x: number;
  avg_y: number;
  count: number;
}[] {
  const neighborhoodMap = new Map<string, { totalX: number; totalY: number; count: number }>();

  rows.forEach((row) => {
    const neighborhood = row[neighborhoodField];
    if (!neighborhood) return;

    // Parse numeric values, remove symbols if needed (e.g., $ or € for price)
    let xRaw = row[xField];
    if (typeof xRaw === 'string') {
      xRaw = xRaw.replace(/[^0-9.]/g, '');
    }
    const x = parseFloat(xRaw);

    let yRaw = row[yField];
    if (typeof yRaw === 'string') {
      yRaw = yRaw.replace(/[^0-9.]/g, '');
    }
    const y = parseFloat(yRaw);

    if (isNaN(x) || isNaN(y)) return;

    if (!neighborhoodMap.has(neighborhood)) {
      neighborhoodMap.set(neighborhood, { totalX: 0, totalY: 0, count: 0 });
    }

    const entry = neighborhoodMap.get(neighborhood)!;
    entry.totalX += x;
    entry.totalY += y;
    entry.count += 1;
  });

  let bubbleData: any;
  if (xField == "estimated_occupancy_l365d") {
    bubbleData = Array.from(neighborhoodMap.entries()).map(([label, val]) => ({
      label,
      avg_x: parseFloat(((val.totalX / val.count) * 100 / 365).toFixed(2)),
      avg_y: parseFloat((val.totalY / val.count).toFixed(2)),
      count: val.count
    }));
  
  }

  else {
    bubbleData = Array.from(neighborhoodMap.entries()).map(([label, val]) => ({
      label,
    avg_x: parseFloat((val.totalX / val.count).toFixed(2)),
    avg_y: parseFloat((val.totalY / val.count).toFixed(2)),
    count: val.count
  }));
  }

  return bubbleData;
}
