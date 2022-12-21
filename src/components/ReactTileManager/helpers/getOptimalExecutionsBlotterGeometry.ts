import { Geometry } from '@cib/windows-manager';
import getStyles, { Styles } from 'styles';
import { convertRemToPixels } from 'utils/remToPixels';

export const getOptimalExecutionsBlotterGeometry = (
  element: HTMLElement,
  width: number,
  height: number
): Geometry => {
  const container = element.parentElement;
  if (container === null) {
    throw new Error('impossible, the window cannot be floating around');
  }
  const styles: Styles = getStyles();

  return new Geometry(
    2,
    window.innerHeight - height - convertRemToPixels(styles.windowFooterSize),
    width,
    height
  );
};
