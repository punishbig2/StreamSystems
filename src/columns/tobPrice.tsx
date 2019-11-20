import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price} from 'components/Table/CellRenderers/Price';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  onBlur: (entry: TOBEntry) => void;
  entry: TOBEntry;
  depths: { [key: string]: TOBTable }
  onUpdate: (entry: TOBEntry) => void;
  onDoubleClick: (type: EntryTypes, entry: TOBEntry) => void;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {entry} = props;
  return (<Price
      depth={getMiniDOBByType(props.depths, entry.tenor, entry.type)}
      arrow={entry.arrowDirection}
      value={entry.price}
      status={entry.status}
      type={entry.type}
      onSubmit={() => props.onUpdate(entry)}
      onDoubleClick={() => props.onDoubleClick(entry.type === EntryTypes.Bid ? EntryTypes.Ofr : EntryTypes.Bid, entry)}
      onChange={(value: number) => props.onBlur({...entry, price: value})}
      onBlur={() => props.onBlur(entry)}/>
  );
};
