import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price, PriceErrors} from 'components/Table/CellRenderers/Price';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  order: Order;
  depths: { [key: string]: TOBTable }
  min?: number | null;
  max?: number | null;
  onDoubleClick?: (type: OrderTypes, order: Order) => void;
  onChange: (order: Order) => void;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
  onError: (order: Order, error: PriceErrors, input: HTMLInputElement) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const onDoubleClick = () => {
    if (!!props.onDoubleClick) {
      props.onDoubleClick(order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid, order);
    }
  };
  const onError = (error: PriceErrors, input: HTMLInputElement) => props.onError(order, error, input);
  const onChange = (price: number | null, changed: boolean) => {
    if (!changed && (order.status & OrderStatus.QuantityEdited) === 0)
      return;
    props.onChange({...order, price});
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
      onError={onError}
      onTabbedOut={(input: HTMLInputElement) => props.onTabbedOut(input, order.type)}
      onDoubleClick={onDoubleClick}
      onChange={onChange}/>
  );
};
