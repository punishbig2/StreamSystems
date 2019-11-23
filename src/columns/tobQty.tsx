import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {EntryStatus, Order} from 'interfaces/order';
import {User} from 'interfaces/user';
import React, {useEffect, useState} from 'react';

interface Props {
  entry: Order;
  user: User;
  onCancel: (entry: Order, cancelRelated: boolean) => void;
  onSubmit: (entry: Order, newQuantity: number) => void;
  onChange: (value: number) => void;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const {entry, user} = props;
  const [value, setValue] = useState<number | null>(entry.quantity);
  useEffect(() => {
    setValue(entry.quantity);
  }, [entry]);
  const onBlur = () => {
    if (value !== null) {
      props.onSubmit(entry, value);
    }
  };
  const onChange = (value: string) => setValue(Number(value));
  const cancellable =
    (((entry.status & EntryStatus.Owned) !== 0) ||
      ((entry.status & EntryStatus.HaveOtherOrders) !== 0)) && (entry.price !== null)
  ;
  const onCancel = () => cancellable ? props.onCancel(entry, true) : null;
  return (
    <Quantity
      value={value}
      type={entry.type}
      onChange={onChange}
      onCancel={onCancel}
      onBlur={onBlur}
      cancelable={cancellable}
      className={'tob-size'}
      firm={user.isBroker ? entry.firm : undefined}/>
  );
};
