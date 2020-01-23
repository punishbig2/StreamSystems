import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import React, {useEffect, useState} from 'react';

interface Props {
  order: Order;
  isDepth: boolean;
  onCancel: (order: Order, cancelRelated: boolean) => void;
  onSubmit: (
    order: Order,
    newQuantity: number | null,
    input: HTMLInputElement
  ) => void;
  value: number | null;
  minSize: number;
  defaultSize: number;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const { order } = props;
  const [value, setValue] = useState<number | null>(order.quantity);
  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const onTabbedOut = (input: HTMLInputElement) => {
    if (value === 0) {
      props.onSubmit(order, null, input);
    } else if (value !== null && value < props.minSize) {
      props.onSubmit(order, props.minSize, input);
    } else {
      props.onSubmit(order, value, input);
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
      if (isNaN(numeric)) return;
      setValue(numeric);
    }
  };

  const canCancel = (order: Order) => {
    const status: OrderStatus = order.status;
    if (order.price === null || order.quantity === null) return false;
    if ((status & OrderStatus.Cancelled) !== 0) return false;
    if (props.isDepth)
      return (
        (status & OrderStatus.Owned) !== 0 ||
        (status & OrderStatus.SameBank) !== 0
      );
    return (
      (status & OrderStatus.Owned) !== 0 ||
      (status & OrderStatus.HaveOrders) !== 0
    );
  };
  const cancellable = canCancel(order);
  const onCancel = () => (cancellable ? props.onCancel(order, true) : null);
  const showChevron =
    !props.isDepth &&
    (order.status & OrderStatus.HaveOrders) !== 0 &&
    (order.status & OrderStatus.HasDepth) !== 0 &&
    order.price !== null;
  return (
    <Quantity
      value={value}
      type={order.type}
      tabIndex={-1}
      onChange={onChange}
      onCancel={onCancel}
      onTabbedOut={onTabbedOut}
      cancellable={cancellable}
      className={getOrderStatusClass(order.status, "size")}
      chevron={showChevron}
    />
  );
};
