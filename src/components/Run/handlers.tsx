import {TOBEntry} from 'interfaces/tobEntry';

export interface QtyHeader {
  value: number;
  onChange: (value: number) => void;
}

type ChangeFn<T = TOBEntry> = (tenor: string, value: T) => void;

export interface RunHandlers {
  onBidChanged: ChangeFn<number>,
  onOfrChanged: ChangeFn<number>,
  onMidChanged: ChangeFn<number>,
  onSpreadChanged: ChangeFn<number>,
  onOfrQtyChanged: ChangeFn<number>,
  onBidQtyChanged: ChangeFn<number>,
  defaultOfrQty: QtyHeader;
  defaultBidQty: QtyHeader;
}
