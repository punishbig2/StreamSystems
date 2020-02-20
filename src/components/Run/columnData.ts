import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {OrderTypes} from 'interfaces/mdEntry';

export interface QtyHeader {
  value: number;
  type: OrderTypes;
  onChange: (value: number | null) => void;
}

type ChangeFn<T> = (tenor: string, value: T | null, changed: boolean) => void;

export interface RunColumnData {
  onBidChanged: ChangeFn<number>;
  onOfrChanged: ChangeFn<number>;
  onMidChanged: ChangeFn<number>;
  onSpreadChanged: ChangeFn<number>;
  onOfrQtyChanged: ChangeFn<number>;
  onBidQtyChanged: ChangeFn<number>;
  defaultOfrSize: QtyHeader;
  defaultBidSize: QtyHeader;
  focusNext: (target: HTMLInputElement, action?: string) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onActivateOrder: (rowID: string, orderType: OrderTypes) => void;
  minimumSize: number;
  defaultSize: number;
}
