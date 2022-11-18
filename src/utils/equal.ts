import deepEqual from 'deep-equal';

export const equal = (A: any, B: any) => {
  if (A instanceof DOMRect) {
    if (!(B instanceof DOMRect)) return false;
    return A.x === B.x && A.y === B.y && A.width === B.width && A.height === B.height;
  }
  return deepEqual(A, B, { strict: true });
};
