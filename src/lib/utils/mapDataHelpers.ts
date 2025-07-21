// function normalizeName(name: string | undefined): string {
//   return name ? name.trim().toLowerCase() : "";
// }

function normalizeName(name: string | undefined): string {
  return name
    ? name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    : "";
}

export function preprocessSentimentData(sentimentRows: Record<string, string>[]) {
  const sentimentData: Record<string, { avg_sentiment: number; review_count: number }> = {};

  for (const row of sentimentRows) {
    const neighborhoodRaw = row['neighbourhood'];
    const neighborhood = normalizeName(neighborhoodRaw);
    if (!neighborhood) continue;

    const avgSentimentRaw = row['avg_sentiment'] ?? "";
    const reviewCountRaw = row['review_count'] ?? "0";

    const avg_sentiment = parseFloat(avgSentimentRaw);
    const review_count = parseInt(reviewCountRaw, 10);

    if (!isNaN(avg_sentiment)) {
      sentimentData[neighborhood] = {
        avg_sentiment,
        review_count: isNaN(review_count) ? 0 : review_count,
      };
    }
  }

  console.log("✅ Processed Sentiment Data:", sentimentData);
  return sentimentData;
}
