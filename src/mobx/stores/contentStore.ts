import { computed, makeObservable } from 'mobx';
import { MessageBlotterStore } from 'mobx/stores/messageBlotterStore';
import { PodStore } from 'mobx/stores/podStore';
import { Persistable } from 'types/persistable';
import { TileType } from 'types/tileType';

export abstract class ContentStore implements Persistable<ContentStore> {
  public abstract readonly kind: TileType;

  public abstract get serialized(): { [key: string]: any };
}

export const isMessageBlotterStore = (obj: any): obj is MessageBlotterStore =>
  'kind' in obj && obj.kind === TileType.MessageBlotter;

export const isPodTileStore = (obj: any): obj is PodStore =>
  'kind' in obj &&
  obj.kind === TileType.PodTile &&
  obj.strategies !== undefined &&
  typeof obj.setRows === 'function';

export class DummyContentStore implements Persistable<DummyContentStore> {
  public readonly kind: TileType = TileType.Empty;

  constructor() {
    makeObservable(this, {
      serialized: computed,
    });
  }

  public get serialized(): { [key: string]: any } {
    return {};
  }
}
