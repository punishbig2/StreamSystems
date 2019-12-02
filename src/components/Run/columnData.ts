import {EntryTypes} from 'interfaces/mdEntry';

export interface QtyHeader {
  value: number;
  onChange: (value: number) => void;
  type: EntryTypes;
}

type ChangeFn<T> = (tenor: string, value: T | null) => void;

export interface RunColumnData {
  onBidChanged: ChangeFn<number>,
  onOfrChanged: ChangeFn<number>,
  onMidChanged: ChangeFn<number>,
  onSpreadChanged: ChangeFn<number>,
  onOfrQtyChanged: ChangeFn<number>,
  onBidQtyChanged: ChangeFn<number>,
  defaultOfrQty: QtyHeader;
  defaultBidQty: QtyHeader;
}
