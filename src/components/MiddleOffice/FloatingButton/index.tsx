import React, { ReactElement } from 'react';

interface Props {
  icon: 'plus';
  onClick: () => void;
}

export const FloatingButton: React.FC<Props> = (props: Props): ReactElement | null => {
  return (
    <div className={'floating-button'}>
      <i className={`fa fa-${props.icon}`}/>
    </div>
  );
};
