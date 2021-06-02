import { API } from "API";
import { action, computed, observable } from "mobx";
import { TileStore } from "mobx/stores/tileStore";
import React from "react";
import { STRM } from "stateDefs/workspaceState";
import { TileType } from "types/tileType";
import { Workspace } from "types/workspace";
import { WorkspaceType } from "types/workspaceType";

export interface BusyMessage {
  readonly title: string;
  readonly detail: string;
}

export class TradingWorkspaceStore implements Workspace {
  public readonly id: string;

  public readonly type: WorkspaceType = WorkspaceType.Trading;

  @observable public tiles: ReadonlyArray<TileStore> = [];
  @observable public personality: string = STRM;
  @observable public name: string = "Untitled";
  @observable public isUserProfileModalVisible = false;
  @observable public errorMessage: string | null = null;
  @observable public loading: boolean = false;
  @observable public progress: number = 0;
  @observable public modified: boolean = false;

  constructor(id: string) {
    this.id = id;
    this.progress = 50;
  }

  public static fromJson(data: { [key: string]: any }): TradingWorkspaceStore {
    const { tiles } = data;
    const newStore = new TradingWorkspaceStore(data.id);
    newStore.personality = data.personality;
    newStore.tiles = tiles.map(
      (data: { [key: string]: any }): TileStore => TileStore.fromJson(data)
    );
    newStore.name = data.name;
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    const { tiles } = this;
    return {
      id: this.id,
      tiles: tiles.map(
        (
          tile: TileStore
        ): {
          [key: string]: any;
        } => tile.serialized
      ),
      personality: this.personality,
      name: this.name,
    };
  }

  @action.bound
  public setPersonality(personality: string) {
    this.personality = personality;
  }

  @action.bound
  public addTile(type: TileType) {
    const { tiles } = this;
    const id: string = `t${Math.round(1e8 * Math.random())}`;
    const newTile: TileStore = new TileStore(id, type);
    switch (type) {
      case TileType.PodTile:
      case TileType.MessageBlotter:
        // Add the window to the window list
        this.tiles = [...tiles, newTile];
        break;
      case TileType.Empty:
      default:
        throw new Error("cannot add this kind of window");
    }
  }

  @action.bound
  public removeTile(windowID: string) {
    const { tiles } = this;
    const index: number = tiles.findIndex(
      ({ id }: TileStore) => id === windowID
    );
    if (index === -1) return; // Perhaps error here?
    this.tiles = [...tiles.slice(0, index), ...tiles.slice(index + 1)];
  }

  @action.bound
  public superRefAll() {
    void API.brokerRefAll();
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
  public setModified(value: boolean): void {
    this.modified = value;
  }

  @action.bound
  private setLoading(value: boolean) {
    this.loading = value;
  }
}

export const WorkspaceStoreContext = React.createContext<TradingWorkspaceStore>(
  new TradingWorkspaceStore("")
);
