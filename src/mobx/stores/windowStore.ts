import { observable, action, computed } from "mobx";
import { persist, create } from "mobx-persist";
import { WindowTypes } from "mobx/stores/workareaStore";
import persistStorage from "persistStorage";

export class WindowStore {
  public id: string = "";

  @persist @observable type: WindowTypes = WindowTypes.Empty;
  // Persist this for fewer calls to the storage
  @persist("object") @observable persistedGeometry: ClientRect = new DOMRect(
    0,
    0,
    0,
    0
  );
  @persist("object") @observable size: { width: number; height: number } = {
    width: 0,
    height: 0,
  };
  // Use this for instant updates
  @observable localGeometry: ClientRect | null = null;
  @persist @observable minimized: boolean = false;
  @persist @observable fitToContent: boolean = true;

  constructor(id: string, type: WindowTypes, fixed?: boolean) {
    this.id = id;
    this.type = type;
    if (!fixed) {
      const hydrate = create({
        storage: persistStorage.windows,
        jsonify: true,
      });
      hydrate(id, this);
    }
  }

  @computed
  public get geometry() {
    if (this.localGeometry === null) return this.persistedGeometry;
    return this.localGeometry;
  }

  @action.bound
  public toggleMinimized() {
    const { left, top } = this.persistedGeometry;
    if (!this.minimized) {
      const { width, height } = this.persistedGeometry;
      this.size = { width: width, height: height };
    } else {
      const { width, height } = this.size;
      this.persistedGeometry = new DOMRect(left, top, width, height);
      this.localGeometry = null;
    }
    this.minimized = !this.minimized;
  }

  @action.bound
  public setGeometry(geometry: ClientRect, resized: boolean) {
    this.localGeometry = geometry;
    if (resized && this.fitToContent) {
      this.fitToContent = false;
    }
  }

  @action.bound
  public saveGeometry(geometry: ClientRect) {
    this.persistedGeometry = geometry;
  }

  @action.bound
  public setFitToContent(value: boolean = true) {
    this.fitToContent = value;
  }

  @action.bound
  public setTitle() {}
}
