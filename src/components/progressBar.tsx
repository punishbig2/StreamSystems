import React, { ReactElement } from 'react';

interface Props {
  readonly value: number;
}

export const ProgressBar: React.FC<Props> = (props: Props): ReactElement => {
  if (props.value < 0 || props.value > 100)
    throw new Error('value can only be in the range [0, 100]');
  return (
    <div className="progress-bar">
      <div className="progress-container">
        <div className="value" style={{ width: props.value + '%' }} />
      </div>
    </div>
  );
};
