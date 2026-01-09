export function prepareBubbleChart(
  rows: any[],
  neighborhoodField: string = 'neighbourhood_cleansed',
  xField: string,
  yField: string = 'review_scores_rating', 
  availabilityField: string = 'availability_365' 
): {
  label: string;
  avg_x: number;
  avg_y: number;
  count: number;
}[] {
  const neighborhoodMap = new Map<string, { totalX: number; totalY: number; totalAvail: number; count: number; yCount: number; }>();

  rows.forEach((row) => {
    const rowId = row.id ?? "(no id)"; 
    const neighborhood = row[neighborhoodField];
    if (!neighborhood) {
      console.log(`Row ${rowId} skipped: missing neighborhood`);
      return;
    }
  
    let aRaw = row[availabilityField];
    if (typeof aRaw === 'string') {
      aRaw = aRaw.trim().replace(/[^0-9.]/g, '');
    }
    const avail = parseFloat(aRaw);

    let xRaw = row[xField];
    if (typeof xRaw === 'string') {
      xRaw = xRaw.trim().replace(/[^0-9.]/g, '');
    }
    const x = parseFloat(xRaw);

    let yRaw = row[yField];
    if (typeof yRaw === 'string') {
      xRaw = xRaw.trim().replace(/[^0-9.]/g, '');
    }
    const y = parseFloat(yRaw);

    if (isNaN(x) || isNaN(avail) || avail <= 0) {
      // console.log(
      //   `Row ${rowId} skipped:`,
      //   `x=${xRaw} (${x}),`,
      //   `y=${yRaw} (${y}),`,
      //   `availability=${aRaw} (${avail})`
      // );
      return;
    }

    if (!neighborhoodMap.has(neighborhood)) {
      neighborhoodMap.set(neighborhood, { totalX: 0, totalY: 0, totalAvail: 0, count: 0, yCount: 0 });
    }

    const entry = neighborhoodMap.get(neighborhood)!;
    entry.totalX += x;
    entry.totalY += isNaN(y) ? 0 : y; 
    entry.totalAvail += avail;
    entry.count += 1;
    if (!isNaN(y)) entry.yCount += 1;

  });

  let bubbleData: any;
  if (xField == "estimated_occupancy_l365d") {
    bubbleData = Array.from(neighborhoodMap.entries()).map(([label, val]) => ({
      label,
      avg_x: parseFloat(((val.totalX / val.totalAvail) * 100).toFixed(2)),
      avg_y: val.yCount > 0 ? parseFloat((val.totalY / val.yCount).toFixed(2)) : 0, 
      count: val.count
    }));
  
  }

  else {
    bubbleData = Array.from(neighborhoodMap.entries()).map(([label, val]) => ({
      label,
    avg_x: parseFloat((val.totalX / val.count).toFixed(2)),
    avg_y: val.yCount > 0 ? parseFloat((val.totalY / val.yCount).toFixed(2)) : 0,
    count: val.count
  }));
  }

  console.log("Bubble Chart Data:", bubbleData);
  return bubbleData;
}
