import { getOptimalSize } from 'windowUtils';
import { toPixels } from 'components/WindowManager/helpers/toPixels';

export const adjustToContent = (element: HTMLDivElement, area: ClientRect) => {
  const { style } = element;
  const size: { width: number, height: number } = getOptimalSize(element);
  style.height = toPixels(size.height);
  style.width = toPixels(size.width);
};
