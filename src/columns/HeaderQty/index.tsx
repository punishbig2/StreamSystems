import {QtyHeader} from 'components/Run/handlers';
import React from 'react';

export const HeaderQty: React.FC<QtyHeader> = (props: QtyHeader) => {
  return (
    <input value={props.value} className={'runs-quantity-input'}
           onChange={({target: {value}}: React.ChangeEvent<HTMLInputElement>) => props.onChange(Number(value))}/>
  );
};
