export function computeWeightedProblemCost(problemDist) {
  let totalCost = 0;
  let totalCount = 0;
  for (const d of problemDist) {
    totalCost += d.count * (d.cost || 0);
    totalCount += d.count;
  }
  return totalCount > 0 ? totalCost / totalCount : 0;
}

export function computeTotalProblems(problemDist) {
  return problemDist.reduce((s, d) => s + d.count, 0);
}
