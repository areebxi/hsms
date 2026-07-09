// Turns a number into "1 bill" vs "3 bills" style text.
export function formatCount(n, singular, plural = `${singular}s`) {
  return `${n} ${n === 1 ? singular : plural}`;
}
