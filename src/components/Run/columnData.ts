import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {OrderTypes} from 'interfaces/mdEntry';

export interface SizeHeaderProps {
  minimum: number;
  value: number;
  type: OrderTypes;
  onReset: () => void;
  onSubmit: (input: HTMLInputElement, value: number) => void;
}

type ChangeFn<T> = (tenor: string, value: T | null, changed: boolean) => void;

export interface RunColumnData {
  onBidChanged: ChangeFn<number>;
  onOfrChanged: ChangeFn<number>;
  onMidChanged: ChangeFn<number>;
  onSpreadChanged: ChangeFn<number>;
  onOfrQtyChanged: ChangeFn<number>;
  onBidQtyChanged: ChangeFn<number>;
  defaultOfrSize: SizeHeaderProps;
  defaultBidSize: SizeHeaderProps;
  focusNext: (target: HTMLInputElement, action?: string) => void;
  onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => void;
  onDeactivateOrder: (rowID: string, orderType: OrderTypes) => void;
  onActivateOrder: (rowID: string, orderType: OrderTypes) => void;
  minimumSize: number;
  defaultSize: number;
  visible: boolean;
}
