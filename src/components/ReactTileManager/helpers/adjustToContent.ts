import { toPixels } from 'components/ReactTileManager/helpers/toPixels';
import { getOptimalSize } from 'utils/windowUtils';

export const adjustToContent = (element: HTMLDivElement) => {
  const { style } = element;
  const size: { width: number; height: number } = getOptimalSize(element);
  style.height = toPixels(size.height);
  style.width = toPixels(size.width);
};
