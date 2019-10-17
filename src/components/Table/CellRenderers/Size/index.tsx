import {SizeLayout} from 'components/Table/CellRenderers/Size/layout';
import React from 'react';

interface SizeProps {
  type: string;
  value: number;
}

export const Size: React.FC<SizeProps> = (props: SizeProps) => {
  const {value} = props;
  return (
    <SizeLayout>
      {props.type === 'rtl' && <div className={'times'}/>}
      <div>{value.toFixed(0)}</div>
      {props.type === 'ltr' && <div className={'times'}/>}
    </SizeLayout>
  );
};
