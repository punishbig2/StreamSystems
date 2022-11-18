import { API } from 'API';
import { BlotterTypes } from 'columns/messageBlotter';
import { action, computed, makeObservable, observable } from 'mobx';
import { BrokerageStore } from 'mobx/stores/brokerageStore';
import { MessageBlotterStore } from 'mobx/stores/messageBlotterStore';
import { TileStore } from 'mobx/stores/tileStore';
import workareaStore from 'mobx/stores/workareaStore';
import React from 'react';
import { NONE } from 'stateDefs/workspaceState';
import { hasRole, Role } from 'types/role';
import { TileType } from 'types/tileType';
import { Workspace } from 'types/workspace';
import { WorkspaceType } from 'types/workspaceType';

export class TradingWorkspaceStore implements Workspace {
  public readonly type: WorkspaceType = WorkspaceType.Trading;
  public readonly brokerageStore = new BrokerageStore();

  public tiles: readonly TileStore[] = [];
  public personality: string = NONE;
  public name = 'Untitled';
  public isUserProfileModalVisible = false;
  public errorMessage: string | null = null;
  public loading = false;
  public modified = false;
  public executionBlotter: MessageBlotterStore;
  public reffingAll = false;

  constructor() {
    this.executionBlotter = new MessageBlotterStore(BlotterTypes.Executions);
    makeObservable(this, {
      tiles: observable,
      personality: observable,
      name: observable,
      isUserProfileModalVisible: observable,
      errorMessage: observable,
      loading: observable,
      modified: observable,
      executionBlotter: observable,
      reffingAll: observable,
      serialized: computed,
      setReffingAll: action.bound,
      setPersonality: action.bound,
      addTile: action.bound,
      removeTile: action.bound,
      superRefAll: action.bound,
      showUserProfileModal: action.bound,
      hideUserProfileModal: action.bound,
      hideErrorModal: action.bound,
      setName: action.bound,
      setModified: action.bound,
      setLoading: action.bound,
    });
  }

  public static fromJson(data: { [key: string]: any }): TradingWorkspaceStore {
    const { tiles } = data;
    const newStore = new TradingWorkspaceStore();
    newStore.personality = data.personality;
    newStore.tiles = tiles.map(
      (data: { [key: string]: any }): TileStore => TileStore.fromJson(data)
    );
    newStore.executionBlotter = MessageBlotterStore.fromJson(data.executionBlotter);
    newStore.name = data.name;
    return newStore;
  }

  public get serialized(): { [key: string]: any } {
    const { tiles, executionBlotter } = this;

    return {
      tiles: tiles.map(
        (
          tile: TileStore
        ): {
          [key: string]: any;
        } => tile.serialized
      ),
      personality: this.personality,
      executionBlotter: executionBlotter.serialized,
      name: this.name,
      type: this.type,
    };
  }

  public setReffingAll(value: boolean): void {
    this.reffingAll = value;
  }

  public setPersonality(personality: string): void {
    this.personality = personality;
  }

  public addTile(type: TileType): void {
    const { tiles } = this;
    const id = `t${Math.round(1e8 * Math.random())}`;
    const newTile: TileStore = new TileStore(id, type);
    switch (type) {
      case TileType.PodTile:
      case TileType.MessageBlotter:
        // Add the window to the window list
        this.tiles = [...tiles, newTile];
        break;
      case TileType.Empty:
      default:
        throw new Error('cannot add this kind of window');
    }
  }

  public removeTile(windowID: string): void {
    const { tiles } = this;
    const index: number = tiles.findIndex(({ id }: TileStore) => id === windowID);
    if (index === -1) return; // Perhaps error here?
    this.tiles = [...tiles.slice(0, index), ...tiles.slice(index + 1)];
  }

  public superRefAll(): void {
    const { roles } = workareaStore.user;

    this.reffingAll = true;
    if (hasRole(roles, Role.Broker)) {
      void API.brokerRefAll();
    } else {
      void API.userRefAll();
    }
  }

  public showUserProfileModal(): void {
    this.isUserProfileModalVisible = true;
  }

  public hideUserProfileModal(): void {
    this.isUserProfileModalVisible = false;
  }

  public hideErrorModal(): void {
    this.errorMessage = null;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public setModified(value: boolean): void {
    this.modified = value;
  }

  public setLoading(value: boolean): void {
    this.loading = value;
  }
}

export const TradingWorkspaceStoreContext = React.createContext<TradingWorkspaceStore>(
  new TradingWorkspaceStore()
);
