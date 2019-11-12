import {StrategyType, SymbolType, TenorType} from 'interfaces/md';
import {$$} from 'utils/stringPaster';

export const toRowId = (tenor: TenorType, symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__ROW', tenor, symbol, strategy);
};

export const toRunId = (symbol: SymbolType, strategy: StrategyType): string => {
  return $$('__RUN', symbol, strategy);
};
