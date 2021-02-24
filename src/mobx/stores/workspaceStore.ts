import React from "react";
import { observable, action } from "mobx";
import { persist, create } from "mobx-persist";
import { API } from "API";
import { randomID } from "utils/randomID";
import workareaStore, { WindowTypes } from "mobx/stores/workareaStore";
import persistStorage from "utils/persistStorage";
import { WindowStore } from "./windowStore";

// We only need to remember the id and type, the id
// will allow as to create it from scratch
export interface WindowDef {
  readonly id: string;
  readonly geometry?: ClientRect;
  readonly type: WindowTypes;
  readonly minimized: boolean;
  readonly position: number;
  readonly fitToContent: boolean;
}

export interface BusyMessage {
  readonly title: string;
  readonly detail: string;
}

export class WorkspaceStore {
  public id: string = "";

  @persist("list") @observable windows: WindowDef[] = [];

  @persist @observable name: string = "Untitled";

  @observable isUserProfileModalVisible = false;
  @observable errorMessage: string | null = null;
  @observable busyMessage: BusyMessage | null = null;
  @observable progress: number = 0;
  @observable windowStores: { [id: string]: WindowStore } = {};

  constructor(id: string) {
    this.id = id;
    this.progress = 50;
    this.setBusyMessage(
      "Loading workspace",
      "Please wait while we load and initialize all your windows"
    );
    this.hydrateMe();
  }

  @action.bound
  public hydrateMe(): void {
    const hydrate = create({
      storage: persistStorage.workspaces,
      jsonify: true,
    });
    this.progress = 100;
    setTimeout((): void => {
      hydrate(this.id, this)
        .then((): void => this.unsetBusyMessage())
        .catch((error: any): void => {
          console.warn(error);
        });
    }, 0);
  }

  @action.bound
  public setPersonality(personality: string) {
    workareaStore.setWorkspacePersonality(this.id, personality);
  }

  @action.bound
  private unsetBusyMessage() {
    this.busyMessage = null;
  }

  @action.bound
  private setBusyMessage(title: string, detail: string) {
    this.busyMessage = { title, detail };
  }

  @action.bound
  public addWindow(type: WindowTypes) {
    const { windows } = this;
    const id: string = randomID("windows");
    const fitToContent: boolean = type === WindowTypes.PodTile;
    const minimized: boolean = false;
    const position: number = windows.length;
    switch (type) {
      case WindowTypes.PodTile:
      case WindowTypes.MessageBlotter:
        // Add the window to the window list
        this.windows = [
          ...windows,
          { id, type, minimized, position, fitToContent },
        ];
        break;
      case WindowTypes.Empty:
      default:
        throw new Error("cannot add this kind of window");
    }
  }

  @action.bound
  public removeWindow(windowID: string) {
    const { windows } = this;
    const index: number = windows.findIndex(
      ({ id }: WindowDef) => id === windowID
    );
    if (index === -1) return; // Perhaps error here?
    this.windows = [...windows.slice(0, index), ...windows.slice(index + 1)];
  }

  @action.bound
  public updateAllGeometries(geometries: { [id: string]: ClientRect }) {
    const { windows } = this;
    // Update all geometries
    this.windows = windows.map((window: WindowDef) => ({
      ...window,
      geometry: geometries[window.id],
    }));
  }

  @action.bound
  public superRefAll() {
    API.brokerRefAll().then(() => {});
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

  public getWindowStore(id: string, type: WindowTypes): any {
    const { windowStores } = this;
    if (windowStores[id] === undefined) {
      windowStores[id] = new WindowStore(id, type);
    }
    return windowStores[id];
  }
}

export const WorkspaceStoreContext = React.createContext<WorkspaceStore>(
  new WorkspaceStore("")
);
