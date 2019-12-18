import {RunActions} from 'components/Run/enumerator';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';

export interface QtyHeader {
  value: number;
  onChange: (value: number) => void;
  type: OrderTypes;
}

type ChangeFn<T> = (tenor: string, value: T | null) => void;

export interface RunColumnData {
  onBidChanged: ChangeFn<number>,
  onOfrChanged: ChangeFn<number>,
  onMidChanged: ChangeFn<number>,
  onSpreadChanged: ChangeFn<number>,
  onOfrQtyChanged: ChangeFn<number>,
  onBidQtyChanged: ChangeFn<number>,
  defaultOfrSize: QtyHeader;
  defaultBidSize: QtyHeader;
  focusNext: (target: HTMLInputElement, action?: RunActions) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onCancelOrder: (order: Order) => void;
}
