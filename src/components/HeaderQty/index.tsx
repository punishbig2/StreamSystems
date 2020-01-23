import {QtyHeader} from 'components/Run/columnData';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import React from 'react';

export const HeaderQty: React.FC<QtyHeader> = (props: QtyHeader) => {
  const onChange = (value: string | null) => {
    if (value === null) return;
    props.onChange(Number(value));
  };
  return <Quantity type={props.type} value={props.value} onChange={onChange}/>;
};
