import {TOBRow} from 'interfaces/tobRow';
import {Currency} from 'interfaces/currency';

export const InvalidCurrency = {name: '', minqty: 0, defaultqty: 0};

export interface WindowState {
  rows: { [tenor: string]: TOBRow };
  strategy: string;
  symbol: Currency;
}

export const DefaultWindowState: WindowState = {
  symbol: InvalidCurrency,
  strategy: "",
  rows: {}
};
