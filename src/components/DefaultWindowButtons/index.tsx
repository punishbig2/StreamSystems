import React from 'react';

interface Props {
  onClose: () => void;
}

export const DefaultWindowButtons: React.FC<Props> = (props: Props) => {
  return (
    <div className={'buttons'}>
      <button onClick={props.onClose}><i className={'fa fa-window-minimize'}/></button>
      <button onClick={props.onClose}><i className={'fa fa-window-maximize'}/></button>
      <button onClick={props.onClose}><i className={'fa fa-times'}/></button>
    </div>
  );
};
