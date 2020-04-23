import React, { ReactElement } from 'react';

export const CircularSpinner: React.FC = (): ReactElement => {
  const rects: number[] = new Array(12);
  // Set all elements
  rects.fill(0);
  return (
    <div className={'circular-spinner'}/>
  );
};
