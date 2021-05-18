import { action, observable } from "mobx";
import { create, persist } from "mobx-persist";
import { WindowTypes } from "mobx/stores/workareaStore";
import persistStorage from "utils/persistStorage";
import { PodTileStore } from "mobx/stores/podTileStore";
import { Geometry } from "@cib/window-manager";
import messages, { MessagesStore } from "mobx/stores/messagesStore";

interface IGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export class WindowStore {
  public id: string = "";
  public contentStore: PodTileStore | MessagesStore;

  @persist @observable type: WindowTypes = WindowTypes.Empty;
  // Persist this for fewer calls to the storage
  @persist("object")
  @observable
  savedGeometry: IGeometry | null = null;
  @observable @persist autosize = true;
  @observable @persist minimized = false;
  @observable @persist docked = true;

  @observable hydrated: boolean = false;

  constructor(id: string, type: WindowTypes, fixed?: boolean) {
    this.id = id;
    this.type = type;
    if (!fixed) {
      const hydrate = create({
        storage: persistStorage.windows,
        jsonify: true,
      });
      hydrate(id, this).then((): void => {
        this.setHydrated();
      });
    }
    this.contentStore = WindowStore.getContentStore(id, type);
  }

  @action.bound
  public setHydrated() {
    this.hydrated = true;
  }

  @action.bound
  public saveGeometry(geometry: Geometry) {
    this.savedGeometry = geometry;
  }

  @action.bound
  public setTitle() {}

  private static getContentStore(id: string, type: WindowTypes): any {
    switch (type) {
      case WindowTypes.PodTile:
        return new PodTileStore(id);
      case WindowTypes.MessageBlotter:
        return messages;
    }
    return null;
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
}
