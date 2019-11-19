import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {TOBEntry} from 'interfaces/tobEntry';
import {User} from 'interfaces/user';
import React from 'react';

interface Props {
  entry: TOBEntry;
  onChange: (value: string) => void;
  user: User;
  onCancel: (entry: TOBEntry) => void;
}

export const TOBQty: React.FC<Props> = (props: Props) => {
  const {entry, user} = props;
  return (
    <Quantity
      value={entry.quantity}
      type={entry.type}
      onChange={props.onChange}
      cancelable={user.email === entry.user && entry.price !== null && entry.quantity !== null}
      onCancel={() => props.onCancel(entry)}
      className={'tob-size'}
      firm={user.isBroker ? entry.firm : undefined}/>
  );
};
