import { Geometry } from "@cib/windows-manager";
import { BlotterTypes } from "columns/messageBlotter";
import { action, computed, observable, trace } from "mobx";
import { ContentStore, DummyContentStore } from "mobx/stores/contentStore";
import { MessageBlotterStore } from "mobx/stores/messageBlotterStore";
import { PodStore } from "mobx/stores/podStore";
import React from "react";
import { Persistable } from "types/persistable";
import { TileType } from "types/tileType";

interface IGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class TileStore implements Persistable<TileStore> {
  public readonly id: string;
  @observable public contentStore: ContentStore;

  @observable public type: TileType = TileType.Empty;
  // Persist this for fewer calls to the storage

  @observable public geometry: IGeometry | null = null;
  @observable public autosize = true;
  @observable public minimized = false;
  @observable public docked = true;
  @observable public scrollable = false;

  public readonly hydrated: boolean = true;

  constructor(tileID: string, type: TileType) {
    this.id = tileID;
    this.scrollable = type === TileType.MessageBlotter;
    this.type = type;
    this.autosize = type !== TileType.MessageBlotter;
    this.contentStore = TileStore.createContentStore(tileID, type);
  }

  public static fromJson(data: { [key: string]: any }): TileStore {
    const { content, ...primitiveMembers } = data;
    const newStore = new TileStore(data.id, data.type);
    switch (newStore.type) {
      case TileType.PodTile:
        newStore.contentStore = PodStore.fromJson(content);
        break;
      case TileType.MessageBlotter:
        newStore.contentStore = MessageBlotterStore.fromJson(content);
        break;
    }
    Object.assign(newStore, primitiveMembers);
    return newStore;
  }

  @computed
  public get serialized(): { [key: string]: any } {
    trace();
    return {
      content: this.content,
      id: this.id,
      geometry: this.geometry,
      autosize: this.autosize,
      minimized: this.minimized,
      docked: this.docked,
      scrollable: this.scrollable,
      type: this.type,
    };
  }

  @computed
  public get content(): { [key: string]: any } {
    const { type, contentStore } = this;
    switch (type) {
      case TileType.PodTile:
        return contentStore.serialized;
      case TileType.MessageBlotter:
        return contentStore.serialized;
      case TileType.Empty:
        break;
    }
    return {};
  }

  @action.bound
  public saveGeometry(geometry: Geometry) {
    this.geometry = geometry;
  }

  @action.bound
  public setAutosize(autosize: boolean): boolean {
    return (this.autosize = autosize);
  }

  @action.bound
  public setMinimized(minimized: boolean): boolean {
    return (this.minimized = minimized);
  }

  @action.bound
  public setDocked(docked: boolean): void {
    this.docked = docked;
  }

  private static createContentStore(id: string, type: TileType): ContentStore {
    switch (type) {
      case TileType.PodTile:
        return new PodStore(id);
      case TileType.MessageBlotter:
        return new MessageBlotterStore(BlotterTypes.Regular);
    }
    return new DummyContentStore();
  }
}

export const TileStoreContext = React.createContext<TileStore>(
  new TileStore("", TileType.Empty)
);
