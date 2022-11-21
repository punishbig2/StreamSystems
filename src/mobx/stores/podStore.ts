import { API, Task } from 'API';
import { orderSorter } from 'components/PodTile/helpers';
import { action, autorun, computed, makeObservable, observable, runInAction } from 'mobx';
import { ContentStore } from 'mobx/stores/contentStore';
import { RunWindowStore } from 'mobx/stores/runWindowStore';
import workareaStore from 'mobx/stores/workareaStore';
import React from 'react';
import signalRManager from 'signalR/signalRClient';
import { DarkPoolQuote } from 'types/darkPoolQuote';
import { FXSymbol } from 'types/FXSymbol';
import { MDEntry } from 'types/mdEntry';
import { Order, OrderStatus } from 'types/order';
import { Persistable } from 'types/persistable';
import { PodRow } from 'types/podRow';
import { PodTable } from 'types/podTable';
import { Product } from 'types/product';
import { hasRole, Role } from 'types/role';
import { TileType } from 'types/tileType';
import { User } from 'types/user';
import { W } from 'types/w';

export class PodStore extends ContentStore implements Persistable<PodStore> {
  public id = '';

  public strategy = '';
  public ccyPair = '';

  public loading = false;
  public currentTenor: string | null = null;

  public darkOrders: { [tenor: string]: readonly Order[] } = {};
  public orders: { [tenor: string]: readonly Order[] } = {};

  public isRunWindowVisible = false;
  // Progress bar
  public isProgressWindowVisible = false;
  public currentProgress: number | null = null;
  public operationStartedAt = 0;
  public rows: { [tenor: string]: PodRow };

  public runWindowStore: RunWindowStore = new RunWindowStore();
  public creatingBulk = false;

  private updateOrdersTimer = setTimeout((): void => {
    return;
  }, 0);
  private ordersCache: { [tenor: string]: readonly Order[] } = {};

  public progressMax = 100;
  public readonly kind: TileType = TileType.PodTile;

  constructor(windowID?: string) {
    super();
    if (windowID === undefined) {
      this.rows = {};
      return;
    }
    this.id = windowID;
    this.orders = {};
    this.rows = {};
    this.ordersCache = {};

    autorun((): void => {
      this.initializeWithDefaults(workareaStore.defaultPodRows, workareaStore.defaultOrders);
    });

    makeObservable(this, {
      strategy: observable,
      ccyPair: observable,
      loading: observable,
      currentTenor: observable,
      darkOrders: observable.ref,
      orders: observable.ref,
      isRunWindowVisible: observable,
      isProgressWindowVisible: observable,
      currentProgress: observable,
      operationStartedAt: observable,
      rows: observable,
      runWindowStore: observable,
      creatingBulk: observable,
      strategies: computed,
      setCreatingBulk: action.bound,
      persist: action.bound,
      setRows: action.bound,
      reloadSnapshot: action.bound,
      initialize: action.bound,
      setStrategy: action.bound,
      setCurrency: action.bound,
      showRunWindow: action.bound,
      hideRunWindow: action.bound,
      setCurrentTenor: action.bound,
      showProgressWindow: action.bound,
      hideProgressWindow: action.bound,
      setProgress: action.bound,
      flushOrderCache: action.bound,
      initializeDepthFromSnapshot: action.bound,
      initializeDarkPoolFromSnapshot: action.bound,
      serialized: computed,
      setDarkPoolPrice: action.bound,
      darkPrices: computed,
    });
  }

  public get strategies(): readonly Product[] {
    const { strategies, symbols } = workareaStore;
    const currentSymbol: FXSymbol | undefined = symbols.find(
      (symbol: FXSymbol): boolean => symbol.symbolID === this.ccyPair
    );
    if (currentSymbol === undefined) return [];
    return strategies.filter((product: Product): boolean => {
      const { ccyGroup } = currentSymbol;
      return product[ccyGroup.toLowerCase()];
    });
  }

  public setCreatingBulk(value: boolean): void {
    this.creatingBulk = value;
  }

  public persist(currency: string, strategy: string): void {
    this.ccyPair = currency;
    this.strategy = strategy;
  }

  public setRows(rows: PodTable): void {
    this.rows = rows;
  }

  public addMarketListener(currency: string, strategy: string, tenor: string): () => void {
    const user = workareaStore.user;
    const darkPool = signalRManager.addDarkPoolOrderListener(
      currency,
      strategy,
      tenor,
      (w: W): void => {
        this.darkOrders = {
          ...this.darkOrders,
          [w.Tenor]: w.Entries.map(
            (entry: MDEntry): Order => Order.fromWAndMDEntry(w, entry, user)
          ),
        };
      }
    );

    const normalPool = signalRManager.addMarketListener(currency, strategy, tenor, (w: W): void => {
      this.updateSingleDepth(tenor, w);
    });

    return (): void => {
      normalPool();
      darkPool();
    };
  }

  public async createBulkOrders(orders: readonly Order[], currency?: FXSymbol): Promise<void> {
    if (currency === undefined) {
      throw new Error('currency not set');
    }

    this.creatingBulk = true;
    try {
      await this.executeBulkCreation(orders, currency);
    } catch (error) {
      console.warn(error);
    }
  }

  public listen(currency: string, strategy: string): Array<() => void> {
    const tenors: readonly string[] = workareaStore.tenors;
    // Install a listener for each tenor
    return [
      ...tenors.map(
        (tenor: string): VoidFunction => this.addMarketListener(currency, strategy, tenor)
      ),
      signalRManager.addRefAllCompleteListener(currency, strategy, (): void => {
        runInAction((): void => {
          void this.reloadSnapshot();
        });
      }),
    ];
  }

  public async reloadSnapshot(): Promise<void> {
    const snapshot = await API.getSnapshot(this.ccyPair, this.strategy).execute();

    const task = this.combineSnapshots(
      this.ccyPair,
      this.strategy,
      workareaStore.tenors,
      snapshot as { [k: string]: W }
    );

    this.initializeDepthFromSnapshot(await task.execute());
    await this.loadDarkPoolSnapshot(this.ccyPair, this.strategy);
  }

  private doInitialize(): Task<void> {
    const { ccyPair, strategy } = this;

    const tenors: readonly string[] = workareaStore.tenors;
    const tasks: Array<Task<any>> = [API.getSnapshot(ccyPair, strategy)];

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
          ccyPair,
          strategy,
          tenors,
          snapshot
        );
        const darkPoolQuotesTask: Task<readonly DarkPoolQuote[]> = API.getDarkPoolLastQuotes(
          ccyPair,
          strategy
        );
        tasks.push(darkPoolQuotesTask);
        tasks.push(combinedTask);
        const nullQuoteReducer = (
          prices: { [tenor: string]: number | null },
          tenor: string
        ): { [tenor: string]: number | null } => ({
          ...prices,
          [tenor]: null,
        });
        const quoteReducer = (
          prices: { [tenor: string]: number | null },
          quote: DarkPoolQuote
        ): { [tenor: string]: number | null } => {
          return {
            ...prices,
            [quote.Tenor]: quote.DarkPrice === undefined ? null : quote.DarkPrice,
          };
        };

        // Other task
        const quotes: readonly DarkPoolQuote[] = await darkPoolQuotesTask.execute();
        const darkPrices = quotes?.reduce(quoteReducer, tenors.reduce(nullQuoteReducer, {})) ?? {};
        const rowIds: readonly string[] = Object.keys(this.rows);
        const combined = await combinedTask.execute();

        runInAction((): void => {
          // Initialize from depth snapshot
          this.initializeDepthFromSnapshot(combined);
          // Dark pool orders
          void this.loadDarkPoolSnapshot(ccyPair, strategy);

          this.rows = rowIds.reduce((rows: PodTable, id: string): PodTable => {
            return {
              ...rows,
              [id]: { ...rows[id], darkPrice: darkPrices[id] ?? null },
            };
          }, this.rows);
        });
      },
      cancel: (): void => {
        for (const task of tasks) {
          task.cancel();
        }
      },
    };
  }

  public initialize(currency: string, strategy: string): Task<void> {
    this.loading = true;
    this.ccyPair = currency;
    this.strategy = strategy;

    return this.doInitialize();
  }

  public setStrategy(strategy: string): void {
    this.strategy = strategy;
  }

  public setCurrency(ccyPair: string): void {
    const { symbols } = workareaStore;
    this.ccyPair = ccyPair;
    setTimeout((): void => {
      const foundSymbol: FXSymbol | undefined = symbols.find(
        (symbol: FXSymbol): boolean => symbol.symbolID === ccyPair
      );

      if (foundSymbol !== undefined) {
        const { strategy } = this;
        if (strategy.startsWith('ATM')) {
          if (foundSymbol.ccyGroup === 'LATAM') {
            this.setStrategy('ATMF');
          } else {
            this.setStrategy('ATMZ');
          }
        }
      }
    }, 0);
  }

  public showRunWindow(): void {
    const { runWindowStore } = this;
    runWindowStore.reset();
    this.isRunWindowVisible = true;
  }

  public hideRunWindow(): void {
    this.isRunWindowVisible = false;
  }

  public setCurrentTenor(tenor: string | null): void {
    this.currentTenor = tenor;
  }

  public showProgressWindow(maximum: number): void {
    this.isProgressWindowVisible = true;
    this.currentProgress = 0;
    this.progressMax = maximum;
    this.operationStartedAt = Date.now();
  }

  public hideProgressWindow(): void {
    this.isProgressWindowVisible = false;
    this.currentProgress = null;
    this.progressMax = 100;
  }

  public setProgress(value: number): void {
    this.currentProgress = value;
  }

  private updateSingleDepth(tenor: string, w: W): void {
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
        this.updateOrders(tenor, orders.sort(orderSorter(first.type)));
      }
    } else {
      this.updateOrders(tenor, []);
    }
  }

  public flushOrderCache(): void {
    this.orders = this.ordersCache;
  }

  private updateOrders(tenor: string, orders: readonly Order[]): void {
    clearTimeout(this.updateOrdersTimer);
    // This should not trigger an update
    this.ordersCache = { ...this.ordersCache, [tenor]: orders };
    // Set a timer to flush the cache into the final object
    this.updateOrdersTimer = setTimeout(this.flushOrderCache, 100);
  }

  public initializeDepthFromSnapshot(ws: { [tenor: string]: W } | null): void {
    if (ws === null) return;
    const user: User | null = workareaStore.user;
    if (user === null) return;
    const tenors: string[] = Object.keys(ws);
    this.orders = tenors.reduce(
      (
        depth: { [k: string]: Order[] },
        tenor: string
      ): {
        [k: string]: Order[];
      } => {
        const w: W = ws[tenor];
        if (!w) return depth;
        const entries: MDEntry[] = w.Entries;
        if (entries)
          depth[tenor] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
        return depth;
      },
      {}
    );
    this.creatingBulk = false;
    this.ordersCache = this.orders;
    this.loading = false;
  }

  private combineSnapshots(
    currency: string,
    strategy: string,
    tenors: readonly string[],
    depth: { [k: string]: W }
  ): Task<{ [k: string]: W }> {
    const task: Task<{ [k: string]: W } | null> = API.getTOBSnapshot(currency, strategy);
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

  public initializeDarkPoolFromSnapshot(snapshot: { [k: string]: W } | null): void {
    const user = workareaStore.user;
    if (snapshot === null) {
      this.darkOrders = {};
    } else {
      this.darkOrders = Object.entries(snapshot).reduce(
        (
          orders: Record<string, readonly Order[]>,
          [tenor, w]: [string, W]
        ): Record<string, readonly Order[]> => ({
          ...orders,
          [tenor]: w.Entries.map((entry: MDEntry): Order => Order.fromWAndMDEntry(w, entry, user)),
        }),
        {}
      );
    }
  }

  private async loadDarkPoolSnapshot(currency: string, strategy: string): Promise<void> {
    const snapshot: {
      [tenor: string]: W;
    } | null = await API.getDarkPoolSnapshot(currency, strategy);

    this.initializeDarkPoolFromSnapshot(snapshot);
  }

  private async executeBulkCreation(orders: readonly Order[], currency: FXSymbol): Promise<void> {
    this.hideRunWindow();
    const { strategy } = this;
    const { user, personality } = workareaStore;
    const promises = orders.map(async (order: Order): Promise<void> => {
      const depth: readonly Order[] = this.orders[order.tenor];
      if (!depth) return;
      const conflict: Order | undefined = depth.find((o: Order) => {
        if (hasRole(user.roles, Role.Broker)) {
          return o.type === order.type && o.firm === personality && o.size !== null;
        }
        return o.type === order.type && o.user === user.email && o.size !== null;
      });
      if (!conflict) return;
      // Cancel said order
      await API.cancelOrder(conflict, user);
    });
    await Promise.all(promises);

    await API.createOrdersBulk(orders, currency.name, strategy, user, currency.minqty);
    this.hideProgressWindow();
  }

  public static fromJson(data: { [key: string]: any }): PodStore {
    const newStore = new PodStore(data.id);
    newStore.ccyPair = data.ccyPair;
    newStore.strategy = data.strategy;
    return newStore;
  }

  public get serialized(): { [key: string]: any } {
    return {
      id: this.id,
      strategy: this.strategy,
      ccyPair: this.ccyPair,
    };
  }

  private initializeWithDefaults(
    defaultPodRows: Record<string, PodRow>,
    defaultOrders: Record<string, readonly Order[]>
  ): void {
    // Initialize depth with empty arrays
    this.orders = defaultOrders;
    this.rows = defaultPodRows;
    this.ordersCache = defaultOrders;
  }

  public setDarkPoolPrice(tenor: string, price: number | null): void {
    this.rows = {
      ...this.rows,
      [tenor]: { ...this.rows[tenor], darkPrice: price },
    };
  }

  public get darkPrices(): Record<string, number | null> {
    const entries = Object.entries(this.rows);

    return entries.reduce(
      (
        prices: Record<string, number | null>,
        [tenor, row]: [string, PodRow]
      ): Record<string, number | null> => ({
        ...prices,
        [tenor]: row.darkPrice,
      }),
      {}
    );
  }
}

export const PodStoreContext = React.createContext<PodStore>(new PodStore());
