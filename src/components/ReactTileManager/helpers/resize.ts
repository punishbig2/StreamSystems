export const resize = (
  x: number,
  y: number,
  width: number,
  height: number,
  r: ClientRect,
  minWidth: number
): DOMRect => {
  const left: number = Math.min(
    Math.max(x, r.left),
    r.right - Math.min(width, r.width)
  );
  const top: number = Math.min(
    Math.max(y, r.top),
    r.bottom - Math.min(height, r.height)
  );
  if (minWidth > 0 && width < minWidth) {
    width = minWidth;
  }
  if (width - left > window.innerWidth)
    return new DOMRect(0, 0, minWidth, height);
  // Create the new rectangle confined to the r rectangle
  return new DOMRect(left, top, width, height);
};
