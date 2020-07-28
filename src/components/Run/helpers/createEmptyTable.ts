import { PodRow, PodRowStatus } from "types/podRow";
import { Order } from "types/order";
import { OrderTypes } from "types/mdEntry";
import { compareTenors } from "utils/tenorUtils";
import { $$ } from "utils/stringPaster";
import { PodTable } from "types/podTable";

export const createEmptyTable = (
  symbol: string,
  strategy: string,
  tenors: string[]
): PodTable => {
  const rows: PodRow[] = tenors.map((tenor: string) => {
    const order: Order = new Order(
      tenor,
      symbol,
      strategy,
      "",
      0,
      OrderTypes.Invalid
    );
    return {
      id: $$("run", symbol, strategy, tenor), // $$(toRunId(symbol, strategy), tenor),
      tenor: tenor,
      bid: { ...order, type: OrderTypes.Bid },
      ofr: { ...order, type: OrderTypes.Ofr },
      mid: null,
      spread: null,
      darkPrice: null,
      status: PodRowStatus.Normal,
    };
  });
  return rows.sort(compareTenors).reduce((table: PodTable, row: PodRow) => {
    table[row.id] = row;
    return table;
  }, {});
};
