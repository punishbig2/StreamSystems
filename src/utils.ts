import {StrategyType, SymbolType, TenorType} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';
import {$$} from 'utils/stringPaster';

export const toRowId = (tenor: TenorType, symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__ROW', tenor, symbol, strategy);
};

export const toRunId = (symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__RUN', symbol, strategy);
};

export const getSideFromType = (type: EntryTypes): Sides => {
  switch (type) {
    case EntryTypes.Bid:
      return Sides.Buy;
    case EntryTypes.Offer:
      return Sides.Sell;
    default:
      throw new Error('wrong type, it has no sensible side');
  }
};
