import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';

export const emptyOffer = (tenor: string, symbol: string, strategy: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Ask, tenor, symbol, strategy, user, price: null, quantity: 10};
};
export const emptyBid = (tenor: string, symbol: string, strategy: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Bid, tenor, symbol, strategy, user, price: null, quantity: 10};
};
