import { action, observable } from "mobx";
import React from "react";

export class RunSizeStore {
  @observable internalValue: string = "";
  @observable locallyModified: boolean = false;

  @action.bound
  public setInternalValue(value: string, locallyModified: boolean): void {
    this.locallyModified = locallyModified;
    this.internalValue = value;
  }
}

export const RunSizeStoreContext = React.createContext<RunSizeStore>(
  new RunSizeStore()
);
