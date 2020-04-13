import { WindowTypes } from 'redux/constants/workareaConstants';
import { PodRow } from 'interfaces/podRow';
import { observable, action } from 'mobx';
import { persist, create } from 'mobx-persist';
import { API } from 'API';
import { W } from 'interfaces/w';
import { PodTable } from 'interfaces/podTable';
import { toPodRow } from 'utils/dataParser';
import { User } from 'interfaces/user';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { tenorToNumber } from 'utils/dataGenerators';

export class PodTileStore {
  public id: string = '';

  @persist @observable strategy: string = '';
  @persist @observable currency: string = '';

  @observable type: WindowTypes = WindowTypes.Empty;
  @observable title: string = '';
  @observable rows: { [tenor: string]: PodRow } = {};
  @observable loading: boolean = false;

  @observable isRunWindowVisible: boolean = false;

  constructor(windowID: string) {
    this.id = `PoD${windowID}`;
    const hydrate = create({
      storage: localStorage,
      jsonify: true,
    });
    hydrate(this.id, this);
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
  private initializeFromSnapshot({ snapshot, user }: { snapshot: { [k: string]: W } | null, user: User }) {
    if (snapshot !== null) {
      const keys: string[] = Object.keys(snapshot);
      // Sort by tenor
      keys.sort((t1: string, t2: string) => tenorToNumber(t1) - tenorToNumber(t2));
      // Update the rows object
      this.rows = keys.reduce((table: PodTable, tenor: string): PodTable => {
        table[tenor] = toPodRow(snapshot[tenor], user);
        // Cache this in the signal R manager object
        SignalRManager.addToCache(snapshot[tenor], user);
        return table;
      }, {});
      this.loading = false;
    }
  }

  public initialize(currency: string, strategy: string, user: User) {
    this.loading = true;
    API.getTOBSnapshot(currency, strategy)
      .then((snapshot: { [k: string]: W } | null) => ({ snapshot, user }))
      .then(this.initializeFromSnapshot);
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
}
