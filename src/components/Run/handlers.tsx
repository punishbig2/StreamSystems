import {TOBEntry} from 'interfaces/tobEntry';

type ChangeFn<T = TOBEntry> = (tenor: string, value: T) => void;
export interface RunHandlers {
  onBidChanged: ChangeFn<string>,
  onOfferChanged: ChangeFn<string>,
  onMidChanged: ChangeFn<string>,
  onSpreadChanged: ChangeFn<string>,
  onOfferQtyChanged: ChangeFn<string>,
  onBidQtyChanged: ChangeFn<string>,
}
