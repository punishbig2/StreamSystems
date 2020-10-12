import { API, Task } from "API";
import { action, observable } from "mobx";
import { create, persist } from "mobx-persist";

import workareaStore, { WindowTypes } from "mobx/stores/workareaStore";
import signalRManager from "signalR/signalRManager";
import { MDEntry } from "types/mdEntry";
import { Order, OrderStatus } from "types/order";
import { PodRow } from "types/podRow";
import { PodTable } from "types/podTable";
import { Symbol } from "types/symbol";
import { User } from "types/user";
import { W } from "types/w";
import { toPodRow } from "utils/dataParser";
import persistStorage from "utils/persistStorage";
import { tenorToNumber } from "utils/tenorUtils";

export class PodTileStore {
  public id: string = "";

  @persist @observable strategy: string = "";
  @persist @observable currency: string = "";

  @observable type: WindowTypes = WindowTypes.Empty;
  @observable title: string = "";
  @observable loading: boolean = false;
  @observable currentTenor: string | null = null;

  @observable.ref darkpool: { [tenor: string]: W } = {};
  @observable.ref rows: { [tenor: string]: PodRow } = {};
  @observable.ref orders: { [tenor: string]: Order[] } = {};

  @observable isRunWindowVisible: boolean = false;
  // Progress bar
  @observable isProgressWindowVisible: boolean = false;
  @observable currentProgress: number | null = null;
  @observable operationStartedAt: number = 0;
  public progressMax: number = 100;
  private creatingBulk: boolean = false;

  constructor(windowID: string) {
    const tenors: ReadonlyArray<string> = workareaStore.tenors;
    this.id = windowID;
    const hydrate = create({
      storage: persistStorage.pods,
      jsonify: true,
    });
    hydrate(this.id, this);
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

  @action.bound
  public persist(currency: string, strategy: string) {
    this.currency = currency;
    this.strategy = strategy;
  }

  @action.bound
  public setRows(rows: PodTable) {
    this.rows = rows;
  }

  @action.bound
  private initializeFromSnapshot(
    snapshot: { [k: string]: W },
    darkpool: { [k: string]: W },
    user: User
  ) {
    if (snapshot !== null) {
      const keys: string[] = Object.keys(snapshot);
      // Sort by tenor
      keys.sort(
        (t1: string, t2: string) => tenorToNumber(t1) - tenorToNumber(t2)
      );
      // Update the rows object
      this.rows = keys.reduce((table: PodTable, tenor: string): PodTable => {
        // Set the darkpool order per row
        signalRManager.handleWMessage({
          ...darkpool[tenor],
          ExDestination: "DP",
        });
        // Now create the row in the table
        table[tenor] = toPodRow(snapshot[tenor], user);
        return table;
      }, {});
      this.loading = false;
    }
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
      this.orders = { ...this.orders, [tenor]: orders };
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
    this.darkpool = snapshot;
  }

  private async loadDarkPoolSnapshot(currency: string, strategy: string) {
    const snapshot: {
      [tenor: string]: W;
    } | null = await API.getDarkPoolSnapshot(currency, strategy);
    if (snapshot !== null) {
      this.initializeDarkPoolFromSnapshot(snapshot);
    }
  }

  private async executeBulkCreation(orders: Array<Order>, currency: Symbol) {
    this.hideRunWindow();
    this.showProgressWindow(-1);
    const { strategy } = this;
    const { user } = workareaStore;
    const promises = orders.map(
      async (order: Order): Promise<void> => {
        const depth: Order[] = this.orders[order.tenor];
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

  public async createBulkOrders(
    orders: Array<Order>,
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
    this.currency = currency;
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
        tasks.push(combinedTask);
        // Initialize from depth snapshot
        this.initializeDepthFromSnapshot(await combinedTask.execute());
        this.loadDarkPoolSnapshot(currency, strategy).then((): void => {});
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
  public setCurrency(currency: string) {
    this.currency = currency;
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
}
