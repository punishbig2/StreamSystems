import React, { ReactElement } from 'react';
import { skipTabIndexAll } from '../../utils/skipTab';
import { priceFormatter } from '../../utils/priceFormatter';
import { getMessagePrice } from '../../messageUtils';
import { Price } from '../../components/Table/CellRenderers/Price';
import { ArrowDirection } from '../../interfaces/w';
import { OrderStatus } from '../../interfaces/order';
import { CellProps } from './cellProps';
import { observer } from 'mobx-react';

export const PriceCell: React.FC<CellProps> = observer((props: CellProps): ReactElement => {
  const { store, message } = props;
  const onSubmit = (input: HTMLInputElement, value: number | null, changed: boolean) => {
    if (changed) {
      store.setPrice(value);
    }
    skipTabIndexAll(input, 1);
  };
  if (message) {
    return <div>{priceFormatter(getMessagePrice(message))}</div>;
  } else {
    return <Price arrow={ArrowDirection.None} value={store.price} status={OrderStatus.None} onSubmit={onSubmit}/>;
  }
});
