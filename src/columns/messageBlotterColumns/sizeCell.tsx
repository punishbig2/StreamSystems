import React, { ReactElement } from 'react';
import { CellProps } from './cellProps';
import { skipTabIndexAll } from '../../utils/skipTab';
import { Size } from '../../components/Table/CellRenderers/Size';
import { OrderTypes } from '../../interfaces/mdEntry';
import { getMessageSize } from '../../messageUtils';
import { observer } from 'mobx-react';

export const SizeCell: React.FC<CellProps> = observer((props: CellProps): ReactElement => {
  const { store, message } = props;
  const onSubmit = (input: HTMLInputElement, value: number | null) => {
    store.setSize(value);
    skipTabIndexAll(input, 1);
  };
  if (!message) {
    return <Size value={store.size} type={OrderTypes.Invalid} hideCancelButton={true} onSubmit={onSubmit}/>;
  } else {
    const size: number = getMessageSize(message);
    return <div>{size.toString()}</div>;
  }
});
