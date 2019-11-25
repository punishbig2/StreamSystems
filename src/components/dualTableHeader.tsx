import React from 'react';

export type HeaderAction = {fn: () => void, label: string};
interface Props {
  action?: HeaderAction;
  label: string;
}

export const DualTableHeader = (props: Props) => {
  const {action} = props;
  return (
    <div className={'dual-header'}>
      <div className={'first'}>{props.label}</div>
      <div className={'second'}>
        {action ? <button onClick={action.fn}>{action.label}</button> : <div>&nbsp;</div>}
      </div>
    </div>
  );
};