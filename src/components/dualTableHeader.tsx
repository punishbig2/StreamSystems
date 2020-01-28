import React, {ReactNode} from 'react';

interface Props {
  action?: (() => ReactNode);
  label: string | (() => ReactNode);
  disabled?: boolean;
}

export const DualTableHeader = (props: Props) => {
  const {action} = props;
  return (
    <div className={'dual-header'}>
      <div className={'first'}>{props.label}</div>
      <div className={'second'}>
        {action ? action() : <div>&nbsp;</div>}
      </div>
    </div>
  );
};
