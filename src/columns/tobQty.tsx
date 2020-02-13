import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useState, useEffect} from 'react';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {$$} from 'utils/stringPaster';
import {OrderTypes} from 'interfaces/mdEntry';

interface Props {
  order: Order;
  isDepth: boolean;
  onCancel: (order: Order, cancelRelated: boolean) => void;
  onSubmit: (
    order: Order,
    newQuantity: number | null,
    personality: string,
    minSize: number,
    input: HTMLInputElement,
  ) => void;
  value: number | null;
  minSize: number;
  defaultSize: number;
  personality: string;
  onNavigate: (input: HTMLInputElement, direction: NavigateDirection) => void;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const {order} = props;
  const [value, setValue] = useState<number | null>(props.value);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (order.type === OrderTypes.Bid) {
      const type: string = $$(order.uid(), order.type, 'CLEAR_SIZE');
      const clearSize = () => {
        setValue(null);
      };
      document.addEventListener(type, clearSize);
      return () => {
        document.removeEventListener(type, clearSize);
      };
    }
  }, [order]);

  const onSubmitted = (input: HTMLInputElement) => {
    if (order.price === null) {
      setValue(null);
      props.onSubmit(order, null, props.personality, props.minSize, input);
    } else {
      if (value === 0) {
        props.onSubmit(order, null, props.personality, props.minSize, input);
      } else if (value !== null && value < props.minSize) {
        props.onSubmit(order, props.minSize, props.personality, props.minSize, input);
      } else {
        props.onSubmit(order, value, props.personality, props.minSize, input);
      }
    }
  };

  const onChange = (value: string | null) => {
    if (value === null) {
      if ((order.status & OrderStatus.PreFilled) !== 0) {
        setValue(order.quantity);
      } else {
        setValue(null);
      }
    } else {
      const numeric: number = Number(value);
      if (isNaN(numeric))
        return;
      setValue(numeric);
    }
  };

  const canCancel = (order: Order) => {
    const status: OrderStatus = order.status;
    if (order.price === null || order.quantity === null)
      return false;
    if ((status & OrderStatus.Cancelled) !== 0)
      return false;
    if (props.isDepth)
      return ((status & OrderStatus.Owned) !== 0 || (status & OrderStatus.SameBank) !== 0);
    return ((status & OrderStatus.Owned) !== 0 || (status & OrderStatus.HaveOrders) !== 0);
  };

  const cancellable = canCancel(order);
  const onCancel = () => (cancellable ? props.onCancel(order, true) : null);
  const showChevron = !props.isDepth
    && (order.status & OrderStatus.HaveOrders) !== 0
    && (order.status & OrderStatus.HasDepth) !== 0
    && order.price !== null;

  const onBlur = () => {
    if (order.type === OrderTypes.Ofr) {
      if (order.price === null || (order.status & OrderStatus.Cancelled) !== 0) {
        setValue(null);
      }
    }
  };

  return (
    <Quantity
      value={value}
      type={order.type}
      tabIndex={-1}
      cancellable={cancellable}
      className={getOrderStatusClass(order.status, 'size')}
      chevron={showChevron}
      onNavigate={props.onNavigate}
      onBlur={onBlur}
      onChange={onChange}
      onCancel={onCancel}
      onSubmitted={onSubmitted}/>
  );
};

