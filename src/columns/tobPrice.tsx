import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {Price} from 'components/Table/CellRenderers/Price';
import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus, TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import React from 'react';

interface Props {
  entry: TOBEntry;
  depths: { [key: string]: TOBTable }
  onUpdate: (entry: TOBEntry) => void;
  onDoubleClick: (type: EntryTypes, entry: TOBEntry) => void;
  onChange: (entry: TOBEntry) => void;
}

function doIHaveOrdersForThisEntry(depths: { [key: string]: TOBTable }, tenor: string, type: EntryTypes): EntryStatus {
  const entry: TOBTable | undefined = depths[tenor];
  if (!entry)
    return EntryStatus.None;
  const isEntryMineAndValid = (entry: TOBEntry): boolean => {
    if ((entry.status & EntryStatus.Owned) === 0 || (entry.status & EntryStatus.PreFilled) === 0)
      return false;
    return (entry.status & EntryStatus.Cancelled) === 0;
  };
  const values: TOBRow[] = Object.values(entry);
  const isMyOfr: ({ofr}: TOBRow) => boolean = ({ofr}: TOBRow) => isEntryMineAndValid(ofr);
  const isMyBid: ({bid}: TOBRow) => boolean = ({bid}: TOBRow) => isEntryMineAndValid(bid);
  switch (type) {
    case EntryTypes.Invalid:
      break;
    case EntryTypes.Ofr:
      return values.find(isMyOfr) ? EntryStatus.HaveOtherOrders : EntryStatus.None;
    case EntryTypes.Bid:
      return values.find(isMyBid) ? EntryStatus.HaveOtherOrders : EntryStatus.None;
    case EntryTypes.DarkPool:
      break;
  }
  return EntryStatus.None;
}

export const TOBPrice: React.FC<Props> = (props: Props) => {
  const {entry} = props;
  const notMineButIHave: EntryStatus = doIHaveOrdersForThisEntry(props.depths, entry.tenor, entry.type);
  return (
    <Price
      depth={getMiniDOBByType(props.depths, entry.tenor, entry.type)}
      arrow={entry.arrowDirection}
      value={entry.price}
      status={entry.status | notMineButIHave}
      type={entry.type}
      onSubmit={() => props.onUpdate(entry)}
      onDoubleClick={() => props.onDoubleClick(entry.type === EntryTypes.Bid ? EntryTypes.Ofr : EntryTypes.Bid, entry)}
      onChange={(price: number) => props.onChange({...entry, price})}/>
  );
};
