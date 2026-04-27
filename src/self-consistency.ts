export function majority<T>(samples: T[], equal: (a: T, b: T) => boolean = (a, b) => a === b): T {
  if (samples.length === 0) {
    throw new Error('majority called on empty array');
  }
  const buckets: { value: T; count: number }[] = [];
  for (const sample of samples) {
    const bucket = buckets.find((b) => equal(b.value, sample));
    if (bucket) {
      bucket.count++;
    } else {
      buckets.push({ value: sample, count: 1 });
    }
  }
  buckets.sort((a, b) => b.count - a.count);
  return buckets[0]!.value;
}
