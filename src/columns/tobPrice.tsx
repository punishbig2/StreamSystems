import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price, PriceErrors} from 'components/Table/CellRenderers/Price';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {$$} from 'utils/stringPaster';

interface Props {
  order: Order;
  depths: { [key: string]: TOBTable };
  min?: number | null;
  max?: number | null;
  readOnly?: boolean;
  onDoubleClick?: (type: OrderTypes, order: Order) => void;
  onChange: (order: Order) => void;
  onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => void;
  onError: (order: Order, error: PriceErrors, input: HTMLInputElement) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const onDoubleClick = () => {
    if (!!props.onDoubleClick) {
      props.onDoubleClick(
        order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid,
        order,
      );
    }
  };
  const onError = (error: PriceErrors, input: HTMLInputElement) =>
    props.onError(order, error, input);
  const onChange = (price: number | null, changed: boolean) => {
    if (price === null && (order.status & OrderStatus.PreFilled) === 0) {
      document.dispatchEvent(new CustomEvent($$(order.uid(), 'CLEAR_SIZE')));
    }
    if (!changed && (order.status & OrderStatus.QuantityEdited) === 0) {
      return;
    }
    props.onChange({...order, price});
  };
  return (
    <Price
      uid={`${order.uid()}${order.type}`}
      arrow={order.arrowDirection}
      value={order.price}
      timestamp={order.timestamp}
      status={order.status}
      type={order.type}
      min={props.min}
      max={props.max}
      readOnly={props.readOnly}
      tooltip={() => (
        <MiniDOB {...props} rows={getMiniDOBByType(props.depths, order.tenor, order.type)}/>
      )}
      onError={onError}
      onTabbedOut={(input: HTMLInputElement) =>
        props.onTabbedOut(input, order.type)
      }
      onDoubleClick={onDoubleClick}
      onNavigate={props.onNavigate}
      onChange={onChange}/>
  );
};
