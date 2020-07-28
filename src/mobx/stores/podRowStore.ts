import { observable, action } from "mobx";
import { PodRow, PodRowStatus } from "types/podRow";
import { createRow } from "components/PodTile/Row/helpers/emptyRowCreator";
import { Order } from "types/order";
import { OrderTypes } from "types/mdEntry";
import { InvertedMarketsError } from "columns/podColumns/OrderColumn/helpers/onSubmitPrice";
import { SizeTooSmallError } from "columns/podColumns/OrderColumn/helpers/onSubmitSize";

export class PodRowStore {
  @observable internalRow: PodRow;

  constructor(currency: string, strategy: string, tenor: string) {
    this.internalRow = createRow(currency, strategy, tenor);
  }

  @action.bound
  public replaceOrder(order: Order) {
    switch (order.type) {
      case OrderTypes.Invalid:
        break;
      case OrderTypes.Ofr:
        this.internalRow = { ...this.internalRow, ofr: order };
        break;
      case OrderTypes.Bid:
        this.internalRow = { ...this.internalRow, bid: order };
        break;
      case OrderTypes.DarkPool:
        break;
    }
  }

  @action.bound
  public setInternalRow(row: PodRow) {
    this.internalRow = row;
  }

  @action.bound
  public setError(error: Error | null) {
    if (error === InvertedMarketsError) {
      this.internalRow = {
        ...this.internalRow,
        status: PodRowStatus.InvertedMarketsError,
      };
    } else if (error === SizeTooSmallError) {
      this.internalRow = {
        ...this.internalRow,
        status: PodRowStatus.SizeTooSmall,
      };
    } else {
      this.internalRow = { ...this.internalRow, status: PodRowStatus.Normal };
    }
  }
}
