import { API, Task } from "API";
import { orderSorter } from "components/PodTile/helpers";
import { action, computed, observable } from "mobx";
import { ContentStore } from "mobx/stores/contentStore";

import workareaStore from "mobx/stores/workareaStore";
import React from "react";
import signalRManager from "signalR/signalRManager";
import { DarkPoolQuote } from "types/darkPoolQuote";
import { MDEntry } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { Persistable } from "types/persistable";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";
import { Product } from "types/product";
import { Symbol } from "types/symbol";
import { TileType } from "types/tileType";
import { User } from "types/user";
import { W } from "types/w";

export class PodStore extends ContentStore implements Persistable<PodStore> {
  public id: string = "";

  @observable strategy: string = "";
  @observable ccyPair: string = "";

  @observable loading: boolean = false;
  @observable currentTenor: string | null = null;

  @observable.ref darkPoolOrders: { [tenor: string]: W } = {};
  @observable.ref orders: { [tenor: string]: ReadonlyArray<Order> } = {};

  @observable isRunWindowVisible: boolean = false;
  // Progress bar
  @observable isProgressWindowVisible: boolean = false;
  @observable currentProgress: number | null = null;
  @observable operationStartedAt: number = 0;
  @observable.ref rows: { [tenor: string]: PodRow } = {};

  public progressMax: number = 100;
  public readonly kind: TileType = TileType.PodTile;
  private creatingBulk: boolean = false;

  constructor(windowID?: string) {
    super();
    if (windowID === undefined) return;
    const tenors: ReadonlyArray<string> = workareaStore.tenors;
    this.id = windowID;
    const reducer = (
      depth: { [tenor: string]: Order[] },
      tenor: string
    ): { [tenor: string]: Order[] } => {
      depth[tenor] = [];
      return depth;
    };
    // Initialize depth with empty arrays
    this.orders = tenors.reduce(reducer, {});
  }

  @computed
  public get strategies(): ReadonlyArray<Product> {
    const { strategies, symbols } = workareaStore;
    const currentSymbol: Symbol | undefined = symbols.find(
      (symbol: Symbol): boolean => symbol.symbolID === this.ccyPair
    );
    if (currentSymbol === undefined) return [];
    return strategies.filter((product: Product): boolean => {
      const { ccyGroup } = currentSymbol;
      return product[ccyGroup.toLowerCase()];
    });
  }

  @action.bound
  public persist(currency: string, strategy: string) {
    this.ccyPair = currency;
    this.strategy = strategy;
  }

  @action.bound
  public setRows(rows: PodTable) {
    this.rows = rows;
  }

  public addMarketListener(
    currency: string,
    strategy: string,
    tenor: string
  ): () => void {
    return signalRManager.addMarketListener(
      currency,
      strategy,
      tenor,
      (w: W): void => {
        this.updateSingleDepth(tenor, w);
      }
    );
  }

  public async createBulkOrders(
    orders: ReadonlyArray<Order>,
    currency?: Symbol
  ): Promise<void> {
    if (currency === undefined) {
      throw new Error("currency not set");
    }
    this.creatingBulk = true;
    try {
      await this.executeBulkCreation(orders, currency);
    } finally {
      this.creatingBulk = false;
    }
  }

  public createMarketListeners(
    currency: string,
    strategy: string
  ): Array<() => void> {
    const tenors: ReadonlyArray<string> = workareaStore.tenors;
    // Install a listener for each tenor
    return tenors.map((tenor: string): (() => void) =>
      this.addMarketListener(currency, strategy, tenor)
    );
  }

  public initialize(currency: string, strategy: string): Task<void> {
    const tenors: ReadonlyArray<string> = workareaStore.tenors;
    // FIXME these should tasks instead of promises
    // Now initialize it
    this.loading = true;
    this.ccyPair = currency;
    this.strategy = strategy;
    // Load depth
    const tasks: Array<Task<any>> = [API.getSnapshot(currency, strategy)];
    return {
      execute: async (): Promise<void> => {
        const snapshotTask: Task<{ [k: string]: W }> = tasks[0] as Task<{
          [k: string]: W;
        }>;
        const snapshot: {
          [k: string]: W;
        } | null = await snapshotTask.execute();
        if (snapshot === null) return;
        // Combine TOB and full snapshots
        const combinedTask: Task<{ [k: string]: W }> = this.combineSnapshots(
          currency,
          strategy,
          tenors,
          snapshot
        );
        const darkPoolQuotesTask: Task<
          ReadonlyArray<DarkPoolQuote>
        > = API.getDarkPoolLastQuotes(currency, strategy);
        tasks.push(darkPoolQuotesTask);
        tasks.push(combinedTask);
        // Initialize from depth snapshot
        this.initializeDepthFromSnapshot(await combinedTask.execute());
        this.loadDarkPoolSnapshot(currency, strategy).then((): void => {});
        // Other task
        const quotes: ReadonlyArray<DarkPoolQuote> = await darkPoolQuotesTask.execute();
        const darkPrices = quotes.reduce(
          (
            prices: { [tenor: string]: number | null },
            quote: DarkPoolQuote
          ): { [tenor: string]: number | null } => {
            return {
              ...prices,
              [quote.Tenor]:
                quote.DarkPrice === undefined ? null : quote.DarkPrice,
            };
          },
          {}
        );
        const rowIds: ReadonlyArray<string> = Object.keys(this.rows);
        this.rows = rowIds.reduce((rows: PodTable, id: string): PodTable => {
          return { ...rows, [id]: { ...rows[id], darkPrice: darkPrices[id] } };
        }, this.rows);
      },
      cancel: (): void => {
        for (const task of tasks) {
          task.cancel();
        }
      },
    };
  }

  @action.bound
  public setStrategy(strategy: string) {
    this.strategy = strategy;
  }

  @action.bound
  public setCurrency(ccyPair: string) {
    const { symbols } = workareaStore;
    this.ccyPair = ccyPair;
    setTimeout((): void => {
      const foundSymbol: Symbol | undefined = symbols.find(
        (symbol: Symbol): boolean => symbol.symbolID === ccyPair
      );
      if (foundSymbol !== undefined) {
        const { strategy } = this;
        if (strategy.startsWith("ATM")) {
          if (foundSymbol.ccyGroup === "LATAM") {
            this.setStrategy("ATMF");
          } else {
            this.setStrategy("ATMZ");
          }
        }
      }
    }, 0);
  }

  @action.bound
  public showRunWindow() {
    this.isRunWindowVisible = true;
  }

  @action.bound
  public hideRunWindow() {
    this.isRunWindowVisible = false;
  }

  @action.bound
  public setCurrentTenor(tenor: string | null) {
    if (tenor !== null) {
      const orders = this.orders[tenor];
      const count: number = orders.reduce(
        (sum: number, order: Order): number => {
          if (
            (order.status & OrderStatus.Cancelled) ===
            OrderStatus.Cancelled
          ) {
            return sum;
          } else {
            return sum + 1;
          }
        },
        0
      );
      if (count === 0) {
        return;
      }
    }
    this.currentTenor = tenor;
  }

  @action.bound
  public showProgressWindow(maximum: number) {
    this.isProgressWindowVisible = true;
    this.currentProgress = 0;
    this.progressMax = maximum;
    this.operationStartedAt = Date.now();
  }

  @action.bound
  public hideProgressWindow() {
    this.isProgressWindowVisible = false;
    this.currentProgress = null;
    this.progressMax = 100;
  }

  @action.bound
  public setProgress(value: number) {
    this.currentProgress = value;
  }

  @action.bound
  private updateSingleDepth(tenor: string, w: W) {
    const entries: MDEntry[] = w.Entries;
    if (entries) {
      const user: User | null = workareaStore.user;
      if (user === null) return;
      const orders: Order[] = entries
        .map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user))
        .filter((order: Order): boolean => {
          if (this.creatingBulk) {
            return (order.status & OrderStatus.Cancelled) === 0;
          } else {
            return true;
          }
        });
      if (orders.length > 0) {
        const first: Order = orders[0];
        this.orders = {
          ...this.orders,
          [tenor]: orders.sort(orderSorter(first.type)),
        };
      }
    } else {
      this.orders = { ...this.orders, [tenor]: [] };
    }
  }

  @action.bound
  private initializeDepthFromSnapshot(ws: { [tenor: string]: W } | null) {
    if (ws === null) return;
    const user: User | null = workareaStore.user;
    if (user === null) return;
    const tenors: string[] = Object.keys(ws);
    this.orders = tenors.reduce(
      (
        depth: { [k: string]: Order[] },
        tenor: string
      ): { [k: string]: Order[] } => {
        const w: W = ws[tenor];
        if (!w) return depth;
        const entries: MDEntry[] = w.Entries;
        if (entries)
          depth[tenor] = entries.map((entry: MDEntry) =>
            Order.fromWAndMDEntry(w, entry, user)
          );
        return depth;
      },
      {}
    );
    this.loading = false;
  }

  private combineSnapshots(
    currency: string,
    strategy: string,
    tenors: ReadonlyArray<string>,
    depth: { [k: string]: W }
  ): Task<{ [k: string]: W }> {
    const task: Task<{ [k: string]: W } | null> = API.getTOBSnapshot(
      currency,
      strategy
    );
    return {
      execute: async (): Promise<{ [k: string]: W }> => {
        const snapshot: { [k: string]: W } | null = await task.execute();
        if (snapshot === null) return {};
        return tenors.reduce((mixed: { [k: string]: W }, tenor: string) => {
          const w: W = depth[tenor];
          if (w) {
            mixed[tenor] = w;
            if (snapshot[tenor]) {
              const tob: W = snapshot[tenor];
              const entries: MDEntry[] = tob.Entries;
              const old: MDEntry[] = entries.filter(
                (entry: MDEntry) => entry.MDEntrySize === undefined
              );
              if (w.Entries) {
                w.Entries = [...w.Entries, ...old];
              } else {
                w.Entries = old;
              }
            }
          } else {
            mixed[tenor] = snapshot[tenor];
          }
          return mixed;
        }, {});
      },
      cancel: () => {
        task.cancel();
      },
    };
  }

  @action.bound
  private initializeDarkPoolFromSnapshot(snapshot: { [k: string]: W }) {
    this.darkPoolOrders = snapshot;
  }

  private async loadDarkPoolSnapshot(currency: string, strategy: string) {
    const snapshot: {
      [tenor: string]: W;
    } | null = await API.getDarkPoolSnapshot(currency, strategy);

    if (snapshot !== null) {
      this.initializeDarkPoolFromSnapshot(snapshot);
    }
  }

  private async executeBulkCreation(
    orders: ReadonlyArray<Order>,
    currency: Symbol
  ) {
    this.hideRunWindow();
    this.showProgressWindow(-1);
    const { strategy } = this;
    const { user } = workareaStore;
    const promises = orders.map(
      async (order: Order): Promise<void> => {
        const depth: ReadonlyArray<Order> = this.orders[order.tenor];
        if (!depth) return;
        const conflict: Order | undefined = depth.find((o: Order) => {
          return (
            o.type === order.type && o.user === user.email && o.size !== null
          );
        });
        if (!conflict) return;
        // Cancel said order
        await API.cancelOrder(conflict, user);
      }
    );
    await Promise.all(promises);
    await API.createOrdersBulk(
      orders,
      currency.name,
      strategy,
      user,
      currency.minqty
    );
    this.hideProgressWindow();
  }

  public static fromJson(data: { [key: string]: any }): PodStore {
    const newStore = new PodStore(data.id);
    newStore.ccyPair = data.ccyPair;
    newStore.strategy = data.strategy;
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    return {
      id: this.id,
      strategy: this.strategy,
      ccyPair: this.ccyPair,
    };
  }
}

export const PodStoreContext = React.createContext<PodStore>(new PodStore());