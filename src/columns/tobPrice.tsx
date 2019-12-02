import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price} from 'components/Table/CellRenderers/Price';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  entry: Order;
  depths: { [key: string]: TOBTable }
  onUpdate: (entry: Order) => void;
  onDoubleClick?: (type: EntryTypes, entry: Order) => void;
  onChange: (entry: Order) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {entry} = props;
  const onDoubleClick = () => {
    if (!!props.onDoubleClick) {
      props.onDoubleClick(entry.type === EntryTypes.Bid ? EntryTypes.Ofr : EntryTypes.Bid, entry);
    }
  };
  return (
    <Price
      depth={getMiniDOBByType(props.depths, entry.tenor, entry.type)}
      arrow={entry.arrowDirection}
      value={entry.price}
      status={entry.status}
      type={entry.type}
      onSubmit={() => props.onUpdate(entry)}
      onDoubleClick={onDoubleClick}
      onChange={(price: number | null) => props.onChange({...entry, price})}/>
  );
};
