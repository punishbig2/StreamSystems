export const getOptimalSize = (element: HTMLDivElement): { width: number, height: number } => {
  const { style } = element;
  const size: { width: number, height: number } = { width: 0, height: 0 };
  const [top, left] = [style.top, style.left];

  const savedWidth = style.width;
  const savedHeight = style.height;

  style.width = '1px';
  style.height = '1px';
  size.width = element.scrollWidth;
  size.height = element.scrollHeight;

  style.width = savedWidth;
  style.height = savedHeight;
  style.top = top;
  style.left = left;
  return size;
};
