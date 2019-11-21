import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {TOBEntry} from 'interfaces/tobEntry';
import {User} from 'interfaces/user';
import React, {useEffect, useState} from 'react';

interface Props {
  entry: TOBEntry;
  user: User;
  onCancel: (entry: TOBEntry) => void;
  onSubmit: (entry: TOBEntry, newQuantity: number) => void;
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
  const onCancel = () => props.onCancel(entry);
  return (
    <Quantity
      value={value}
      type={entry.type}
      onChange={onChange}
      onCancel={onCancel}
      onBlur={onBlur}
      cancelable={user.email === entry.user && entry.price !== null && entry.quantity !== null}
      className={'tob-size'}
      firm={user.isBroker ? entry.firm : undefined}/>
  );
};
