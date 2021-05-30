import { computed } from "mobx";
import { MessagesStore } from "mobx/stores/messagesStore";
import { PodStore } from "mobx/stores/podStore";
import { Persistable } from "types/persistable";
import { TileType } from "types/tileType";

export abstract class ContentStore implements Persistable<ContentStore> {
  public abstract readonly kind: TileType;

  public abstract get serialized(): { [key: string]: any };
}

export const isMessageStore = (obj: any): obj is MessagesStore =>
  "kind" in obj && obj.kind === TileType.MessageBlotter;
export const isPodTileStore = (obj: any): obj is PodStore =>
  "kind" in obj &&
  obj.kind === TileType.PodTile &&
  obj.strategies !== undefined &&
  typeof obj.setRows === "function";

export class DummyContentStore implements Persistable<DummyContentStore> {
  public readonly kind: TileType = TileType.Empty;

  @computed
  public get serialized(): { [key: string]: any } {
    return {};
  }
}
