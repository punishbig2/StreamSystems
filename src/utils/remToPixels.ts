export function convertRemToPixels(rem: number): number {
  const documentStyle = getComputedStyle(document.documentElement);
  return rem * parseFloat(documentStyle.fontSize);
}
