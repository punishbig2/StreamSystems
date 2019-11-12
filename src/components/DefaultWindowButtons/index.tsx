import React from 'react';

interface Props {
  onClose?: () => void;
  onMinimize?: () => void;
}

export const DefaultWindowButtons: React.FC<Props> = (props: Props) => {
  return (
    <div className={'window-buttons'}>
      <button onClick={props.onMinimize}><i className={'fa fa-minus'}/></button>
      <button onClick={props.onClose}><i className={'fa fa-times'}/></button>
    </div>
  );
};
