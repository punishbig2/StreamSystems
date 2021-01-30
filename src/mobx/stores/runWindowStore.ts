import { action, computed, observable } from "mobx";
import { Order, OrderMessage, OrderStatus } from "types/order";
import { PodTable } from "types/podTable";
import { ordersReducer } from "../../components/Run/helpers/ordersReducer";
import { API, Task } from "../../API";
import workareaStore from "./workareaStore";
import { OrderTypes } from "../../types/mdEntry";
import { PodRow, PodRowStatus } from "../../types/podRow";
import { createEmptyTable } from "../../components/Run/helpers/createEmptyTable";
import { BrokerageWidths } from "../../types/brokerageWidths";
import { getSelectedOrders } from "../../components/Run/helpers/getSelectedOrders";

class RunRow implements PodRow {
  readonly darkPrice: number | null = null;
  readonly id: string = "";
  readonly status: PodRowStatus = PodRowStatus.Normal;
  readonly tenor: string = "";

  @computed
  public get mid(): number | null {
    return null;
  }

  @computed
  public get spread(): number | null {
    return null;
  }

  @computed
  public get ofr(): Order {
    return {} as Order;
  }

  @computed
  public get bid(): Order {
    return {} as Order;
  }
}

export class RunWindowStore {
  @observable.ref rows: PodTable<RunRow> = {};
  @observable.ref original: PodTable<RunRow> = {};

  @observable defaultBidSize = 0;
  @observable defaultOfrSize = 0;

  @observable isLoading = false;
  @observable activeOrders: { [id: string]: Order };

  @observable.ref selection: ReadonlyArray<Order> = [];
  @observable.ref brokerageWidths: BrokerageWidths = [];

  @observable initialized = false;

  constructor(orders: { [tenor: string]: Order[] }) {
    console.log("creating a new store");
    const { user } = workareaStore;
    this.activeOrders = Object.values(orders)
      .reduce((flat: Order[], next: Order[]) => [...flat, ...next], [])
      .filter(
        (order: Order) => order.user === user.email && order.size !== null
      )
      .map((order: Order) => ({
        ...order,
        status: order.status | OrderStatus.Active,
      }))
      .reduce(ordersReducer, {});
  }

  @action.bound
  public setSpreadAll(value: number): void {}

  @action.bound
  public setMidAll(value: number): void {}

  @action.bound
  public initialize(
    symbol: string,
    strategy: string,
    tenors: ReadonlyArray<string>
  ): Task<void> {
    this.initialized = true;
    const { email } = workareaStore.user;
    const task: Task<OrderMessage[]> = API.getRunOrders(
      email,
      symbol,
      strategy
    );
    // We first fill it as placeholder
    this.setOrders(createEmptyTable(symbol, strategy, tenors));
    // And this task does the rest
    return {
      execute: async (): Promise<void> => {
        this.setLoading(true);
        try {
          const messages: ReadonlyArray<OrderMessage> = await task.execute();
          // Set the orders now
          this.handleRunOrdersResult(symbol, strategy, tenors, email, messages);
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
  }

  @action.bound
  public activateRow(id: string): void {}

  @action.bound
  public setMid(id: string, value: number | null): void {}

  @action.bound
  public setBidPrice(id: string, value: number | null): void {
    console.log(this.rows[id]);
  }

  @action.bound
  public setOfrPrice(id: string, value: number | null): void {}

  @action.bound
  public setBidSize(id: string, value: number | null): void {}

  @action.bound
  public setOfrSize(id: string, value: number | null): void {}

  @action.bound
  public setSpread(id: string, value: number | null): void {}

  @action.bound
  public activateOrder(id: string, type: OrderTypes): void {}

  @action.bound
  public deactivateOrder(id: string, type: OrderTypes): void {}

  @action.bound
  public setDefaultBidSize(value: number | null): void {
    if (value === null) return;
    this.defaultBidSize = value;
  }

  @action.bound
  public setDefaultOfrSize(value: number | null): void {
    if (value === null) return;
    this.defaultOfrSize = value;
  }

  @action.bound
  private setOrders(table: PodTable): void {
    this.rows = table;
  }

  private handleRunOrdersResult(
    symbol: string,
    strategy: string,
    tenors: ReadonlyArray<string>,
    email: string,
    messages: ReadonlyArray<OrderMessage>
  ) {
    const getMid = (row: PodRow): number | null => {
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
    };
    const getSpread = (row: PodRow): number | null => {
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
    };
    const { activeOrders } = this;
    const prevOrders: { [id: string]: Order } = messages
      .map((message: OrderMessage) => Order.fromOrderMessage(message, email))
      .map((order: Order) => ({
        ...order,
        status: (order.status & ~OrderStatus.Active) | OrderStatus.Cancelled,
      }))
      .reduce(ordersReducer, {});
    const orders: Order[] = Object.values({
      ...prevOrders,
      ...activeOrders,
    });
    const rows: PodRow[] = Object.values(
      createEmptyTable(symbol, strategy, tenors)
    );
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
          row.spread = getSpread(row);
          row.mid = getMid(row);
          return { ...row };
        }
      )
      .reduce((table: PodTable, row: PodRow): PodTable => {
        table[row.id] = row;
        return table;
      }, {});
    // dispatch(createAction<RunActions>(RunActions.SetTable, table));
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
}
