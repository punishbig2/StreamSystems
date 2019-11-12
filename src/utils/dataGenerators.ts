import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';

export const emptyOffer = (tenor: string, symbol: string, strategy: string, user: string, quantity: number | null = null): TOBEntry => {
  return {firm: '', type: EntryTypes.Ask, tenor, symbol, strategy, user, price: null, quantity};
};

export const emptyBid = (tenor: string, symbol: string, strategy: string, user: string, quantity: number | null = null): TOBEntry => {
  return {firm: '', type: EntryTypes.Bid, tenor, symbol, strategy, user, price: null, quantity};
};

const tenorToNumber = (value: string) => {
  // FIXME: probably search the number boundary
  const multiplier: number = Number(value.substr(0, 1));
  const unit: string = value.substr(1);
  switch (unit) {
    case 'W':
      return multiplier;
    case 'M':
      return 5 * multiplier;
    case 'Y':
      return 60 * multiplier;
  }
  return 0;
};

export const compareTenors = (a: TOBRow, b: TOBRow) => {
  const at: string = a.tenor;
  const bt: string = b.tenor;
  return tenorToNumber(at) - tenorToNumber(bt);
};
