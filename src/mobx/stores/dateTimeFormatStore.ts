import React from "react";
import { findDefaultTimezone } from "utils/commonUtils";
import { observable, action } from "mobx";

export class DateTimeFormatStore {
  public static Context = React.createContext<DateTimeFormatStore>(
    new DateTimeFormatStore()
  );

  public static Provider = DateTimeFormatStore.Context.Provider;

  @observable public currentTimezone: string;

  constructor() {
    this.currentTimezone = findDefaultTimezone();
  }

  @action.bound
  public setTimezone(timezone: string): void {
    this.currentTimezone = timezone;
  }
}
