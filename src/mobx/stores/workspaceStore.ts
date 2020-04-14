import { observable, action } from 'mobx';
import { STRM } from 'redux/stateDefs/workspaceState';
import { WindowTypes } from 'redux/constants/workareaConstants';
import { persist, create } from 'mobx-persist';
import { API } from 'API';
import { randomID } from 'randomID';

// We only need to remember the id and type, the id
// will allow as to create it from scratch
export interface WindowDef {
  id: string;
  geometry?: ClientRect;
  type: WindowTypes;
  minimized: boolean;
  position: number;
  fitToContent: boolean;
}

export class WorkspaceStore {
  public id: string = '';

  @persist('list') @observable windows: WindowDef[] = [];

  @persist @observable personality: string = STRM;
  @persist @observable name: string = 'Untitled';

  @observable isUserProfileModalVisible = false;
  @observable markets: string[] = [];
  @observable errorMessage: string | null = null;
  @observable toast: string | null = null;

  constructor(id: string) {
    this.id = id;
    const hydrate = create({
      storage: localStorage,
      jsonify: true,
    });
    hydrate(id, this);
  }

  @action.bound
  public addWindow(type: WindowTypes) {
    const { windows } = this;
    const id: string = `WnD${type}${randomID()}`;
    const fitToContent: boolean = type === WindowTypes.PodTile;
    const minimized: boolean = false;
    const position: number = windows.length;
    switch (type) {
      case WindowTypes.PodTile:
      case WindowTypes.MessageBlotter:
        // Add the window to the window list
        this.windows = [...windows, { id, type, minimized, position, fitToContent }];
        break;
      case WindowTypes.Empty:
      default:
        throw new Error('cannot add this kind of window');
    }
  }

  @action.bound
  public showToast(toast: string | null) {
    this.toast = toast;
  }

  @action.bound
  public removeWindow(windowID: string) {
    const { windows } = this;
    const index: number = windows.findIndex(({ id }: WindowDef) => id === windowID);
    if (index === -1)
      return; // Perhaps error here?
    this.windows = [...windows.slice(0, index), ...windows.slice(index + 1)];
  }

  @action.bound
  public updateAllGeometries(geometries: { [id: string]: ClientRect }) {
    const { windows } = this;
    // Update all geometries
    this.windows = windows.map((window: WindowDef) => ({ ...window, geometry: geometries[window.id] }));
  }

  @action.bound
  public setPersonality(personality: string) {
    this.personality = personality;
  }

  @action.bound
  public loadMarkets() {
    API.getBanks()
      .then((markets: string[]) => {
        this.markets = markets;
      });
  }

  @action.bound
  public superRefAll() {
  }

  @action.bound
  public showUserProfileModal() {
    this.isUserProfileModalVisible = true;
  }

  @action.bound
  public hideUserProfileModal() {
    this.isUserProfileModalVisible = false;
  }

  @action.bound
  public hideErrorModal() {
    this.errorMessage = null;
  }

  @action.bound
  public setName(name: string) {
    this.name = name;
  }

  @action.bound
  public persist(windows: WindowDef[]) {
    this.windows = windows;
  }
}
