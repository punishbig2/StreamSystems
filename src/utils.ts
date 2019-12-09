import {StrategyType, SymbolType, TenorType} from 'interfaces/w';
import {OrderTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';
import {$$} from 'utils/stringPaster';

export const toRowId = (tenor: TenorType, symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__ROW', tenor, symbol, strategy);
};

export const toRunId = (symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__RUN', strategy, symbol);
};

export const getSideFromType = (type: OrderTypes): Sides => {
  switch (type) {
    case OrderTypes.Bid:
      return Sides.Buy;
    case OrderTypes.Ofr:
      return Sides.Sell;
    default:
      throw new Error('wrong type, it has no sensible side');
  }
};

export const percentage = (numerator: number, denominator: number): string => {
  const percentage: number = 100 * numerator / denominator;
  return `${percentage}%`;
};
