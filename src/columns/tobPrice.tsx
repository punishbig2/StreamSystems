import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price} from 'components/Table/CellRenderers/Price';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  order: Order;
  depths: { [key: string]: TOBTable }
  onDoubleClick?: (type: OrderTypes, order: Order) => void;
  onChange: (order: Order) => void;
  min?: number | null;
  max?: number | null;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const onDoubleClick = () => {
    if (!!props.onDoubleClick) {
      props.onDoubleClick(order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid, order);
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
      onTabbedOut={(input: HTMLInputElement) => props.onTabbedOut(input, order.type)}
      onDoubleClick={onDoubleClick}
      onChange={(price: number | null) => props.onChange({...order, price})}/>
  );
};
