import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {OrderStatus, Order} from 'interfaces/order';
import {User} from 'interfaces/user';
import React, {useEffect, useState} from 'react';

interface Props {
  order: Order;
  user: User;
  onCancel: (order: Order, cancelRelated: boolean) => void;
  onSubmit: (order: Order, newQuantity: number) => void;
  onChange: (value: number) => void;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const {order, user} = props;
  const [value, setValue] = useState<number | null>(order.quantity);
  useEffect(() => {
    setValue(order.quantity);
  }, [order]);
  const onBlur = () => {
    if (value !== null) {
      props.onSubmit(order, value);
    }
  };
  const onChange = (value: string) => setValue(Number(value));
  const cancellable =
    (((order.status & OrderStatus.Owned) !== 0) ||
      ((order.status & OrderStatus.HaveOtherOrders) !== 0)) && (order.price !== null)
  ;
  const onCancel = () => cancellable ? props.onCancel(order, true) : null;
  const showChevron =
    (order.status & OrderStatus.HaveOtherOrders) !== 0 &&
    (order.status & OrderStatus.Owned) === 0 &&
    (order.price !== null);
  return (
    <Quantity
      value={value}
      type={order.type}
      onChange={onChange}
      onCancel={onCancel}
      onBlur={onBlur}
      cancelable={cancellable}
      className={'tob-size'}
      chevron={showChevron}
      firm={user.isBroker ? order.firm : undefined}/>
  );
};
