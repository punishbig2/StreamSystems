import { API, Task } from "API";
import { createEmptyTable } from "components/Run/helpers/createEmptyTable";
import { getSelectedOrders } from "components/Run/helpers/getSelectedOrders";
import { ordersReducer } from "components/Run/helpers/ordersReducer";
import { RunRowProxy } from "components/Run/helpers/runRowProxy";
import { action, observable } from "mobx";
import { BrokerageWidths } from "types/brokerageWidths";
import { OrderTypes } from "types/mdEntry";
import { Order, OrderMessage, OrderStatus } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { PodTable } from "types/podTable";
import { Role } from "types/role";
import { sizeFormatter } from "utils/sizeFormatter";
import workareaStore from "./workareaStore";

export class RunWindowStore {
  @observable.ref rows: PodTable = {};
  @observable.ref original: PodTable = {};

  @observable defaultBidSize = 0;
  @observable defaultOfrSize = 0;

  @observable isLoading = false;
  @observable activeOrders: { [id: string]: Order } = {};

  @observable.ref selection: ReadonlyArray<Order> = [];
  @observable.ref brokerageWidths: BrokerageWidths = [];

  @observable initialized = false;

  private static orderTypeToRowKey(
    type: OrderTypes
  ): keyof Pick<PodRow, "ofr" | "bid"> {
    switch (type) {
      case OrderTypes.Ofr:
        return "ofr";
      case OrderTypes.Bid:
        return "bid";
      default:
        throw new Error("cannot convert order type to key");
    }
  }

  private toActiveOrder(order: Order): Order {
    let status: OrderStatus =
      order.status | OrderStatus.Active | OrderStatus.PriceEdited;
    const defaultSize: number =
      order.type === OrderTypes.Ofr ? this.defaultOfrSize : this.defaultBidSize;
    if (sizeFormatter(order.size) !== sizeFormatter(defaultSize)) {
      status |= OrderStatus.SizeEdited;
    }
    return {
      ...order,
      /* Remove the cancelled flag too */
      status: status & ~OrderStatus.Cancelled,
    };
  }

  private toInactiveOrder(order: Order): Order {
    const rowId: string = `run${order.symbol}${order.strategy}${order.tenor}`;
    const orderKey: "bid" | "ofr" =
      order.type === OrderTypes.Bid ? "bid" : "ofr";
    return {
      ...order,
      size: this.original[rowId][orderKey].size,
      status:
        (order.status | OrderStatus.Cancelled) &
        ~OrderStatus.Active &
        ~OrderStatus.PriceEdited,
    };
  }

  private recomputePrices(originalRow: PodRow): PodRow {
    const row = new Proxy(originalRow, RunRowProxy);
    if (row.mid === null || row.spread === null) {
      return row;
    }
    const { bid, ofr } = row;
    return {
      ...row,
      bid: this.toActiveOrder({
        ...bid,
        status: bid.status,
        price: row.mid - row.spread / 2,
      }),
      ofr: this.toActiveOrder({
        ...ofr,
        status: ofr.status,
        price: row.mid + row.spread / 2,
      }),
    };
  }

  private static forEachRow(
    rows: PodTable,
    action: (row: PodRow) => PodRow
  ): PodTable {
    const ids: ReadonlyArray<string> = Object.keys(rows);
    return ids.reduce((newRows: PodTable, id: string): PodTable => {
      const row: PodRow = newRows[id];
      // Now return the fixed row
      return {
        ...newRows,
        [id]: action(row),
      };
    }, rows);
  }

  @action.bound
  public setMidOrSpreadAll(value: number | null, key: "mid" | "spread"): void {
    this.rows = RunWindowStore.forEachRow(
      this.rows,
      (row: PodRow): PodRow => this.recomputePrices({ ...row, [key]: value })
    );
  }

  @action.bound
  public setSpreadAll(value: number): void {
    this.setMidOrSpreadAll(value, "spread");
  }

  @action.bound
  public setMidAll(value: number): void {
    this.setMidOrSpreadAll(value, "mid");
  }

  @action.bound
  public initialize(
    symbol: string,
    strategy: string,
    tenors: ReadonlyArray<string>,
    orders: { [id: string]: Order[] }
  ): Task<void> {
    const { user } = workareaStore;
    const filterOrders = (order: Order): boolean => {
      const { roles } = user;
      if (order.size === null) return false;
      if (order.user !== user.email) return false;
      return !(
        roles.includes(Role.Broker) && order.firm !== workareaStore.personality
      );
    };
    this.initialized = true;
    this.activeOrders = Object.values(orders)
      .reduce((flat: Order[], next: Order[]) => [...flat, ...next], [])
      .filter(filterOrders)
      .map((order: Order) => ({
        ...order,
        status: order.status | OrderStatus.Active,
      }))
      .reduce(ordersReducer, {});
    const task: Task<OrderMessage[]> = API.getRunOrders(
      user.email,
      symbol,
      strategy
    );
    const originalTable: PodTable = createEmptyTable(symbol, strategy, tenors);
    // We first fill it as placeholder
    this.setOrders(originalTable);
    // And this task does the rest
    return {
      execute: async (): Promise<void> => {
        this.setLoading(true);
        try {
          const messages: ReadonlyArray<OrderMessage> = await task.execute();
          // Set the orders now
          this.handleRunOrdersResult(user.email, messages);
        } finally {
          this.setLoading(false);
        }
      },
      cancel: (): void => {
        task.cancel();
      },
    };
  }

  @action.bound
  private setLoading(value: boolean): void {
    this.isLoading = value;
  }

  @action.bound
  public setDefaultSize(value: number): void {
    this.defaultBidSize = value;
    this.defaultOfrSize = value;
    this.rows = RunWindowStore.forEachRow(
      this.rows,
      (row: PodRow): PodRow => {
        return {
          ...row,
          ofr: {
            ...row.ofr,
            size: value,
          },
          bid: {
            ...row.bid,
            size: value,
          },
        };
      }
    );
  }

  @action.bound
  public activateRow(id: string): void {
    const { rows } = this;
    const row = rows[id];
    this.rows = {
      ...rows,
      [id]: {
        ...row,
        bid: this.toActiveOrder(row.bid),
        ofr: this.toActiveOrder(row.ofr),
        spread: null,
        mid: null,
      },
    };
  }

  private static recomputeMidAndSpread(originalRow: PodRow): PodRow {
    const row = new Proxy(originalRow, RunRowProxy);
    const { bid, ofr } = row;
    if (bid.price === null || ofr.price === null) return row;
    return {
      ...row,
      spread: RunWindowStore.getSpread(row),
      mid: RunWindowStore.getMid(row),
    };
  }

  @action.bound
  private setOrderPrice(id: string, value: number | null, type: OrderTypes) {
    const key = RunWindowStore.orderTypeToRowKey(type);
    const row: PodRow = this.rows[id];
    const order: Order = row[key];
    this.rows = {
      ...this.rows,
      [id]: RunWindowStore.recomputeMidAndSpread({
        ...row,
        [key]: this.toActiveOrder({
          ...order,
          size:
            type === OrderTypes.Bid ? this.defaultBidSize : this.defaultOfrSize,
          price: value,
        }),
        status: PodRowStatus.Normal,
      }),
    };
  }

  @action.bound
  public setBidPrice(id: string, value: number | null): void {
    this.setOrderPrice(id, value, OrderTypes.Bid);
  }

  @action.bound
  public setOfrPrice(id: string, value: number | null): void {
    this.setOrderPrice(id, value, OrderTypes.Ofr);
  }

  private setOrderSize(
    id: string,
    value: number | null,
    type: OrderTypes
  ): void {
    const row: PodRow = this.rows[id];
    const key = RunWindowStore.orderTypeToRowKey(type);
    const order: Order = row[key];
    // Ignore if the price is not yet set
    if (order.price === null) return;
    this.rows = {
      ...this.rows,
      [id]: {
        ...row,
        [key]: this.toActiveOrder({
          ...order,
          status: order.status | OrderStatus.SizeEdited,
          size: value,
        }),
        status: PodRowStatus.Normal,
      },
    };
  }

  @action.bound
  public setBidSize(id: string, value: number | null): void {
    this.setOrderSize(id, value, OrderTypes.Bid);
  }

  @action.bound
  public setOfrSize(id: string, value: number | null): void {
    this.setOrderSize(id, value, OrderTypes.Ofr);
  }

  @action.bound
  private setMidOrSpread(
    id: string,
    value: number | null,
    key: "mid" | "spread"
  ): void {
    const { rows } = this;
    const row = rows[id];
    this.rows = {
      ...rows,
      [id]: this.recomputePrices({ ...row, [key]: value }),
    };
  }

  @action.bound
  public setSpread(id: string, value: number | null): void {
    this.setMidOrSpread(id, value, "spread");
  }

  @action.bound
  public setMid(id: string, value: number | null): void {
    this.setMidOrSpread(id, value, "mid");
  }

  @action.bound
  public activateOrder(id: string, type: OrderTypes): void {
    const { rows } = this;
    const key = RunWindowStore.orderTypeToRowKey(type);
    const row = rows[id];
    this.rows = {
      ...rows,
      [id]: RunWindowStore.recomputeMidAndSpread({
        ...row,
        [key]: this.toActiveOrder(row[key]),
      }),
    };
  }

  @action.bound
  public deactivateOrder(id: string, type: OrderTypes): void {
    const { rows } = this;
    const key = RunWindowStore.orderTypeToRowKey(type);
    const row = rows[id];
    this.rows = {
      ...rows,
      [id]: {
        ...row,
        [key]: this.toInactiveOrder(row[key]),
        mid: null,
        spread: null,
      },
    };
  }

  @action.bound
  public setDefaultBidSize(value: number | null): void {
    if (value === null) return;
    this.defaultBidSize = value;
    this.rows = RunWindowStore.forEachRow(
      this.rows,
      (row: PodRow): PodRow => {
        return {
          ...row,
          bid: {
            ...row.bid,
            size: value,
          },
        };
      }
    );
  }

  @action.bound
  public setDefaultOfrSize(value: number | null): void {
    if (value === null) return;
    this.defaultOfrSize = value;
    this.rows = RunWindowStore.forEachRow(
      this.rows,
      (row: PodRow): PodRow => {
        return {
          ...row,
          ofr: {
            ...row.ofr,
            size: value,
          },
        };
      }
    );
  }

  @action.bound
  private setOrders(table: PodTable): void {
    this.rows = table;
    this.original = table;
  }

  private static getMid(row: PodRow): number | null {
    const { ofr, bid } = row;
    if (
      ofr.price === null ||
      (ofr.status & OrderStatus.Cancelled) !== 0 ||
      bid.price === null ||
      (bid.status & OrderStatus.Cancelled) !== 0
    ) {
      return null;
    }
    return (ofr.price + bid.price) / 2;
  }

  private static getSpread(row: PodRow): number | null {
    const { ofr, bid } = row;
    if (
      ofr.price === null ||
      (ofr.status & OrderStatus.Cancelled) !== 0 ||
      bid.price === null ||
      (bid.status & OrderStatus.Cancelled) !== 0
    ) {
      return null;
    }
    return ofr.price - bid.price;
  }

  private handleRunOrdersResult(
    email: string,
    messages: ReadonlyArray<OrderMessage>
  ) {
    const { activeOrders } = this;
    const prevOrders: { [id: string]: Order } = messages
      .map((message: OrderMessage) =>
        Order.fromOrderMessage(
          message,
          email,
          this.defaultBidSize,
          this.defaultOfrSize
        )
      )
      .map((order: Order) => ({
        ...order,
        status: (order.status & ~OrderStatus.Active) | OrderStatus.Cancelled,
      }))
      .reduce(ordersReducer, {});
    const orders: Order[] = Object.values({
      ...prevOrders,
      ...activeOrders,
    });
    const rows: PodRow[] = Object.values(this.rows);
    const table: PodTable = rows
      .map(
        (row: PodRow): PodRow => {
          const bid: Order | undefined = orders.find(
            (order: Order) =>
              order.type === OrderTypes.Bid && order.tenor === row.tenor
          );
          const ofr: Order | undefined = orders.find(
            (order: Order) =>
              order.type === OrderTypes.Ofr && order.tenor === row.tenor
          );
          if (bid) row.bid = bid;
          if (ofr) row.ofr = ofr;
          row.spread = RunWindowStore.getSpread(row);
          row.mid = RunWindowStore.getMid(row);
          return row;
        }
      )
      .reduce((table: PodTable, row: PodRow): PodTable => {
        table[row.id] = row;
        return table;
      }, {});
    this.setOrders(table);
  }

  @action.bound
  public setBrokerageWidths(widths: BrokerageWidths): void {
    this.brokerageWidths = widths;
  }

  @action.bound
  public updateSelection() {
    this.selection = getSelectedOrders(
      this.rows,
      this.defaultBidSize,
      this.defaultOfrSize
    );
  }

  @action.bound
  setRowStatus(rowID: string, status: PodRowStatus): void {
    const { rows } = this;
    const row: PodRow = rows[rowID];
    this.rows = {
      ...rows,
      [rowID]: {
        ...row,
        status: status,
      },
    };
  }

  @action.bound
  setInitialized(initialized: boolean): void {
    this.initialized = initialized;
  }
}
