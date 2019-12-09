import {RunActions} from 'components/Run/enumerator';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {OrderTypes} from 'interfaces/mdEntry';

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
  defaultOfrQty: QtyHeader;
  defaultBidQty: QtyHeader;
  focusNext: (target: HTMLInputElement, action: RunActions) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
}
