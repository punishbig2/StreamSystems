import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';

export interface QtyHeader {
  value: number;
  onChange: (value: number) => void;
  type: EntryTypes;
}

type ChangeFn<T = Order> = (tenor: string, value: T) => void;

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
