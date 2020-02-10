import {TOBRow} from 'interfaces/tobRow';
import {Currency} from 'interfaces/currency';
import {WindowTypes} from 'redux/constants/workareaConstants';

export const InvalidCurrency = {name: '', minqty: 0, defaultqty: 0};

export interface WindowState {
  id: string;
  type: WindowTypes;
  title: string;
  rows: { [tenor: string]: TOBRow };
  strategy: string;
  symbol: Currency;
  zIndex: number;
  geometry: ClientRect;
  autoSize: boolean;
  minimized: boolean;
}

export const defaultWindowState: WindowState = {
  id: '',
  type: WindowTypes.Empty,
  title: '',
  symbol: InvalidCurrency,
  strategy: '',
  rows: {},
  zIndex: 1,
  geometry: new DOMRect(0, 0, 0, 0),
  autoSize: true,
  minimized: false,
};
