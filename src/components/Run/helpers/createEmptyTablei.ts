import {PodRow, TOBRowStatus} from 'interfaces/podRow';
import {Order} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {$$} from 'utils/stringPaster';
import {compareTenors} from 'utils/dataGenerators';
import {PodTable} from 'interfaces/podTable';

export const createEmptyTable = (symbol: string, strategy: string, tenors: string[]) => {
  const rows: PodRow[] = tenors.map((tenor: string) => {
    const order: Order = new Order(tenor, symbol, strategy, '', 0, OrderTypes.Invalid);
    return {
      id: $$('run', symbol, strategy, tenor), // $$(toRunId(symbol, strategy), tenor),
      tenor: tenor,
      bid: {...order, type: OrderTypes.Bid},
      ofr: {...order, type: OrderTypes.Ofr},
      mid: null,
      spread: null,
      darkPrice: null,
      status: TOBRowStatus.Normal,
    };
  });
  return rows
    .sort(compareTenors)
    .reduce((table: PodTable, row: PodRow) => {
      table[row.id] = row;
      return table;
    }, {});
};
