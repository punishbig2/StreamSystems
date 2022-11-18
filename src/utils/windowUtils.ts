export interface Size {
  width: number;
  height: number;
}

export const getOptimalSize = (element: HTMLDivElement): Size => {
  const { style } = element;
  const size: Size = { width: 0, height: 0 };
  const [top, left] = [style.top, style.left];

  const savedWidth = style.width;
  const savedHeight = style.height;

  style.width = '100px';
  style.minWidth = 'min-content';
  style.height = '1px';

  size.width = element.scrollWidth;
  size.height = element.scrollHeight;

  style.width = savedWidth;
  style.minWidth = '';
  style.height = savedHeight;
  style.top = top;
  style.left = left;
  return size;
};
