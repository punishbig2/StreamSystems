import { Theme, useTheme } from '@material-ui/core';
import React from 'react';

interface Props {
  size?: number;
}

export const LdsSpinner: React.FC<Props> = ({ size = 80 }: Props): React.ReactElement => {
  const theme: Theme = useTheme();
  const array: number[] = new Array(10);
  // Just to make it a real array
  array.fill(0);

  const duration: number = array.length / 10;
  const width: number = Math.round((3 * size) / 35);
  const height: number = (2 * size) / 5;
  const delta: number = 360 / array.length;
  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
        width: size,
        height: size,
      }}
    >
      {array.map(
        (ignore: number, index: number): React.ReactElement => (
          <div
            style={{
              opacity: 0.6,
              transformOrigin: `${size / 2}px ${size / 2}px`,
              transform: `rotate(${delta * (index - 1)}deg)`,
            }}
            key={index}
          >
            <div
              style={{
                position: 'absolute',
                top: -size / 4 + width,
                height: height,
                left: (size - width) / 2,
                width: width,
                background: theme.palette.text.primary,
                animationName: 'lds-spinner',
                animationDuration: `${duration}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                transform: 'none',
                animationDelay: `${(index / (array.length - 1) - 1) * duration}s`,
              }}
            />
          </div>
        )
      )}
    </div>
  );
};
