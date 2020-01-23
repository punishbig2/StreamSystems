import { OrderTypes } from "interfaces/mdEntry";
import { Order } from "interfaces/order";
import { TOBRow, TOBRowStatus } from "interfaces/tobRow";
import { TOBTable } from "interfaces/tobTable";
import { useEffect } from "react";
import { toRunId } from "utils";
import { compareTenors } from "utils/dataGenerators";
import { $$ } from "utils/stringPaster";

export const useInitializer = (
  tenors: string[],
  symbol: string,
  strategy: string,
  email: string,
  onReady: (table: any) => void
) => {
  useEffect(() => {
    const rows: TOBRow[] = tenors.map((tenor: string) => {
      const getEntry = (type: OrderTypes) => {
        return new Order(tenor, symbol, strategy, email, 10, type);
      };
      const bid: Order = getEntry(OrderTypes.Bid);
      const ofr: Order = getEntry(OrderTypes.Ofr);
      return {
        id: $$(toRunId(symbol, strategy), tenor),
        tenor: tenor,
        bid: bid,
        ofr: ofr,
        mid:
          bid.price !== null && ofr.price !== null
            ? (Number(bid.price) + Number(ofr.price)) / 2
            : null,
        spread:
          bid.price !== null && ofr.price !== null
            ? Number(ofr.price) - Number(bid.price)
            : null,
        darkPrice: null,
        status: TOBRowStatus.Normal
      };
    });
    const table = rows
      .sort(compareTenors)
      .reduce((table: TOBTable, row: TOBRow) => {
        table[row.id] = row;
        return table;
      }, {});
    onReady(table);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, email]);
};
