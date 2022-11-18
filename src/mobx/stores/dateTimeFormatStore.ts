import { action, makeObservable, observable } from 'mobx';
import React from 'react';
import { findDefaultTimezone } from 'utils/commonUtils';

export class DateTimeFormatStore {
  public static Context = React.createContext<DateTimeFormatStore>(new DateTimeFormatStore());

  public static Provider = DateTimeFormatStore.Context.Provider;

  public currentTimezone: string;

  constructor() {
    this.currentTimezone = findDefaultTimezone();
    makeObservable(this, {
      currentTimezone: observable,
      setTimezone: action.bound,
    });
  }

  public setTimezone(timezone: string): void {
    this.currentTimezone = timezone;
  }
}
