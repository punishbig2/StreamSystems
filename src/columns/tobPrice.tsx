import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price} from 'components/Table/CellRenderers/Price';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  order: Order;
  depths: { [key: string]: TOBTable }
  onDoubleClick?: (type: EntryTypes, order: Order) => void;
  onChange: (order: Order) => void;
  min?: number | null;
  max?: number | null;
  onTabbedOut?: (input: HTMLInputElement) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const onDoubleClick = () => {
    if (!!props.onDoubleClick) {
      props.onDoubleClick(order.type === EntryTypes.Bid ? EntryTypes.Ofr : EntryTypes.Bid, order);
    }
  };
  return (
    <Price
      depth={getMiniDOBByType(props.depths, order.tenor, order.type)}
      arrow={order.arrowDirection}
      value={order.price}
      status={order.status}
      type={order.type}
      min={props.min}
      max={props.max}
      onTabbedOut={props.onTabbedOut}
      onDoubleClick={onDoubleClick}
      onChange={(price: number | null) => props.onChange({...order, price})}/>
  );
};
