export const move = (
  x: number,
  y: number,
  width: number,
  height: number,
  r: ClientRect
): DOMRect => {
  const left: number = Math.min(Math.max(x, r.left), r.right - Math.min(width, r.width));
  const top: number = Math.min(Math.max(y, r.top), r.bottom - Math.min(height, r.height));
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};
