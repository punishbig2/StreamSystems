import { Geometry } from '@cib/windows-manager';

export const getOptimalExecutionsBlotterGeometry = (
  element: HTMLElement,
  width: number,
  height: number
): Geometry => {
  const container = element.parentElement;
  if (container === null) {
    throw new Error('impossible, the window cannot be floating around');
  }

  return new Geometry(2, window.innerHeight - height - 38, width, height);
};
