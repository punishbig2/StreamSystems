import { CSSProperties } from 'react';

export const toStyle = (geometry: ClientRect | undefined): CSSProperties | undefined => {
  if (geometry === undefined) return undefined;
  return {
    left: geometry.left,
    top: geometry.top,
    width: geometry.width,
    height: geometry.height,
  };
};
