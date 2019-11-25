import {QtyHeader} from 'components/Run/columnData';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import React from 'react';

export const HeaderQty: React.FC<QtyHeader> = (props: QtyHeader) => {
  return (
    <Quantity type={props.type} value={props.value} onChange={(value: string) => props.onChange(Number(value))}/>
  );
};
