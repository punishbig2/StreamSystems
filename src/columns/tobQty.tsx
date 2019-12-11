import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Order, OrderStatus} from 'interfaces/order';
import {User} from 'interfaces/user';
import {SettingsContext} from 'main';
import React, {useContext, useEffect, useState} from 'react';
import {Settings} from 'settings';

interface Props {
  order: Order;
  user: User;
  onCancel: (order: Order, cancelRelated: boolean) => void;
  onSubmit: (order: Order, newQuantity: number, input: HTMLInputElement) => void;
  onChange: (value: number) => void;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const settings = useContext<Settings>(SettingsContext);
  const {order, user} = props;
  const [value, setValue] = useState<number | null>(order.quantity);
  useEffect(() => {
    setValue(order.quantity);
  }, [order]);

  const onTabbedOut = (input: HTMLInputElement) => {
    if (value !== null) {
      if (value < settings.minSize) {
        props.onSubmit(order, settings.minSize, input);
      } else {
        props.onSubmit(order, value, input);
      }
    }
  };

  const onChange = (value: string | null) => {
    if (value === null) {
      setValue(order.quantity);
    } else {
      setValue(Number(value));
    }
  };

  const cancellable =
    (((order.status & OrderStatus.Owned) !== 0) ||
      ((order.status & OrderStatus.HaveOrders) !== 0)) && (order.price !== null)
  ;
  const onCancel = () => cancellable ? props.onCancel(order, true) : null;
  const showChevron =
    (order.status & OrderStatus.HaveOrders) !== 0 &&
    (order.status & OrderStatus.HasDepth) !== 0 &&
    (order.price !== null);
  return (
    <Quantity
      value={value}
      type={order.type}
      onChange={onChange}
      onCancel={onCancel}
      onTabbedOut={onTabbedOut}
      cancelable={cancellable}
      className={'tob-size'}
      chevron={showChevron}
      firm={user.isBroker ? order.firm : undefined}/>
  );
};
