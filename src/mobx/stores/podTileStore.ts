import { PodRow } from 'interfaces/podRow';
import { observable, action } from 'mobx';
import { persist, create } from 'mobx-persist';
import { API } from 'API';
import { W } from 'interfaces/w';
import { PodTable } from 'interfaces/podTable';
import { toPodRow } from 'utils/dataParser';
import { User } from 'interfaces/user';
import { SignalRManager } from 'signalR/signalRManager';
import { tenorToNumber } from 'utils/dataGenerators';
import { Order } from 'interfaces/order';
import { MDEntry } from 'interfaces/mdEntry';

import workareaStore, { WindowTypes } from 'mobx/stores/workareaStore';
import persistStorage from 'persistStorage';

export class PodTileStore {
  public id: string = '';

  @persist @observable strategy: string = '';
  @persist @observable currency: string = '';

  @observable type: WindowTypes = WindowTypes.Empty;
  @observable title: string = '';
  @observable loading: boolean = false;
  @observable currentTenor: string | null = null;

  @observable.ref rows: { [tenor: string]: PodRow } = {};
  @observable depth: { [tenor: string]: Order[] } = {};

  @observable isRunWindowVisible: boolean = false;
  // Progress bar
  @observable isProgressWindowVisible: boolean = false;
  @observable currentProgress: number | null = null;
  @observable operationStartedAt: number = 0;
  public progressMax: number = 100;

  constructor(windowID: string) {
    const tenors: string[] = workareaStore.tenors;
    this.id = windowID;
    const hydrate = create({
      storage: persistStorage.pods,
      jsonify: true,
    });
    hydrate(this.id, this);
    const reducer = (depth: { [tenor: string]: Order[] }, tenor: string): { [tenor: string]: Order[] } => {
      depth[tenor] = [];
      return depth;
    };
    // Initialize depth with empty arrays
    this.depth = tenors.reduce(reducer, {});
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
  private initializeFromSnapshot(snapshot: { [k: string]: W }, darkpool: { [k: string]: W }, user: User) {
    const signalRManger: SignalRManager = SignalRManager.getInstance();
    if (snapshot !== null) {
      const keys: string[] = Object.keys(snapshot);
      // Sort by tenor
      keys.sort((t1: string, t2: string) => tenorToNumber(t1) - tenorToNumber(t2));
      // Update the rows object
      this.rows = keys.reduce((table: PodTable, tenor: string): PodTable => {
        // Set the darkpool order per row
        signalRManger.handleWMessage({ ...darkpool[tenor], ExDestination: 'DP' });
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
      if (user === null)
        return;
      const orders: Order[] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
      this.depth = { ...this.depth, [tenor]: orders };
    } else {
      this.depth = { ...this.depth, [tenor]: [] };
    }
  }

  @action.bound
  private initializeDepthFromSnapshot(ws: { [tenor: string]: W } | null) {
    if (ws === null)
      return;
    const user: User | null = workareaStore.user;
    if (user === null)
      return;
    const tenors: string[] = Object.keys(ws);
    this.depth = tenors.reduce((depth: { [k: string]: Order[] }, tenor: string): { [k: string]: Order[] } => {
      const w: W = ws[tenor];
      const entries: MDEntry[] = ws[tenor].Entries;
      if (entries) {
        depth[tenor] = entries.map((entry: MDEntry) => Order.fromWAndMDEntry(w, entry, user));
      }
      return depth;
    }, {});
  }

  public async initialize(currency: string, strategy: string, user: User) {
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    this.loading = true;

    const darkpool: { [k: string]: W } | null = await API.getDarkPoolSnapshot(currency, strategy);
    const snapshot: { [k: string]: W } | null = await API.getTOBSnapshot(currency, strategy);
    if (snapshot === null || darkpool === null)
      return;
    this.initializeFromSnapshot(snapshot, darkpool, user);
    // Load depth
    const depth: { [k: string]: W } | null = await API.getSnapshot(currency, strategy);
    const tenors: string[] = workareaStore.tenors;
    tenors.forEach((tenor: string) => {
      signalRManager.setMarketListener(currency, strategy, tenor, (w: W) => {
        this.updateSingleDepth(tenor, w);
      });
    });
    // Initialize from depth snapshot
    this.initializeDepthFromSnapshot(depth);
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
