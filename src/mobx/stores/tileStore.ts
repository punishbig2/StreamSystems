import { Geometry } from '@cib/windows-manager';
import { BlotterTypes } from 'columns/messageBlotter';
import { action, computed, makeObservable, observable } from 'mobx';
import { DummyContentStore, isPodTileStore } from 'mobx/stores/contentStore';
import { MessageBlotterStore } from 'mobx/stores/messageBlotterStore';
import { PodStore } from 'mobx/stores/podStore';
import React from 'react';
import { Order, OrderStatus } from 'types/order';
import { Persistable } from 'types/persistable';
import { TileType } from 'types/tileType';

interface IGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class TileStore implements Persistable<TileStore> {
  public readonly id: string;
  public contentStore: MessageBlotterStore | PodStore | DummyContentStore;

  public type: TileType = TileType.Empty;
  // Persist this for fewer calls to the storage

  public geometry: IGeometry | null = null;
  public autosize = true;
  public minimized = false;
  public docked = true;
  public scrollable = false;

  public readonly hydrated: boolean = true;

  constructor(tileID: string, type: TileType) {
    this.id = tileID;
    this.scrollable = type === TileType.MessageBlotter;
    this.type = type;
    this.autosize = type !== TileType.MessageBlotter;
    this.contentStore = TileStore.createContentStore(tileID, type);

    makeObservable(this, {
      contentStore: observable,
      type: observable,
      geometry: observable,
      autosize: observable,
      minimized: observable,
      docked: observable,
      scrollable: observable,
      serialized: computed,
      content: computed,
      saveGeometry: action.bound,
      setAutosize: action.bound,
      setMinimized: action.bound,
      setDocked: action.bound,
      hasOrders: computed,
    });
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

  public get serialized(): { [key: string]: any } {
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

  public get content(): { [key: string]: any } {
    const { contentStore } = this;
    return contentStore.serialized;
  }

  public saveGeometry(geometry: Geometry): void {
    this.geometry = geometry;
  }

  public setAutosize(autosize: boolean): boolean {
    return (this.autosize = autosize);
  }

  public setMinimized(minimized: boolean): boolean {
    return (this.minimized = minimized);
  }

  public setDocked(docked: boolean): void {
    this.docked = docked;
  }

  private static createContentStore(
    id: string,
    type: TileType
  ): MessageBlotterStore | PodStore | DummyContentStore {
    switch (type) {
      case TileType.PodTile:
        return new PodStore(id);
      case TileType.MessageBlotter:
        return new MessageBlotterStore(BlotterTypes.MessageMonitor);
    }
    return new DummyContentStore();
  }

  public get hasOrders(): boolean {
    const { contentStore } = this;
    if (isPodTileStore(contentStore)) {
      const orders = Object.values(contentStore.orders);
      return orders.some((orders: readonly Order[]): boolean =>
        orders.some((order: Order): boolean => {
          if ((order.status & OrderStatus.Cancelled) === OrderStatus.Cancelled) {
            return false;
          }

          return (
            (order.status & OrderStatus.Owned) === OrderStatus.Owned ||
            (order.status & OrderStatus.SameBank) === OrderStatus.SameBank
          );
        })
      );
    }

    return false;
  }
}

export const TileStoreContext = React.createContext<TileStore>(new TileStore('', TileType.Empty));
