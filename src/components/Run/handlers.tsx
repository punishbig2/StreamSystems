import {TOBEntry} from 'interfaces/tobEntry';

type ChangeFn<T = TOBEntry> = (tenor: string, value: T) => void;
export interface RunHandlers {
  onBidChanged: ChangeFn<number>,
  onOfferChanged: ChangeFn<number>,
  onMidChanged: ChangeFn<number>,
  onSpreadChanged: ChangeFn<number>,
  onOfferQtyChanged: ChangeFn<number>,
  onBidQtyChanged: ChangeFn<number>,
}
