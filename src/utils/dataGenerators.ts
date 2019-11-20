import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus, TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';

export const emptyEntry = (tenor: string, symbol: string, strategy: string, user: string, quantity: number | null, type: EntryTypes): TOBEntry => {
  return {
    type: type,
    tenor,
    symbol,
    strategy,
    user,
    __price: null,
    price: null,
    __quantity: quantity,
    quantity: quantity,
    arrowDirection: ArrowDirection.None,
    status: EntryStatus.None,
  };
};
export const emptyOffer = (tenor: string, symbol: string, strategy: string, user: string, quantity: number | null = null): TOBEntry => {
  return emptyEntry(tenor, symbol, strategy, user, quantity, EntryTypes.Ofr);
};

export const emptyBid = (tenor: string, symbol: string, strategy: string, user: string, quantity: number | null = null): TOBEntry => {
  return emptyEntry(tenor, symbol, strategy, user, quantity, EntryTypes.Bid);
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

