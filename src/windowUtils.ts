const windowRect = (): ClientRect => new DOMRect(0, 0, window.innerWidth, window.innerHeight);
export const addClass = (element: HTMLDivElement, className: string) => {
  const list: DOMTokenList = element.classList;
  if (list) {
    list.add(className);
  }
};

export const getOptimalSize = (element: HTMLDivElement, area: ClientRect = windowRect()): { width: number, height: number } => {
  const { style } = element;
  const size: { width: number, height: number } = { width: 0, height: 0 };
  const [top, left] = [style.top, style.left];
  style.width = '1px';
  style.height = '1px';
  style.top = '0';
  style.left = '0';
  size.width = (() => {
    if (element.scrollWidth + element.offsetLeft < area.width) {
      return element.scrollWidth;
    } else {
      return area.width - element.offsetLeft;
    }
  })();
  size.height = (() => {
    if (element.scrollHeight + element.offsetTop < area.height) {
      return element.scrollHeight;
    } else {
      return area.height - element.offsetTop;
    }
  })();
  style.width = 'auto';
  style.height = 'auto';
  style.top = top;
  style.left = left;
  return size;
};
