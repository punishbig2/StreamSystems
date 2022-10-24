import React from "react";
import { DateTimeFormatStore } from "mobx/stores/dateTimeFormatStore";
import { observe } from "mobx";

export const useDateTimeFormat = (): Intl.DateTimeFormat => {
  const store = React.useContext<DateTimeFormatStore>(
    DateTimeFormatStore.Context
  );
  const [timezone, setTimezone] = React.useState<string>(store.currentTimezone);

  observe(store, "currentTimezone", (): void => {
    setTimezone(store.currentTimezone);
  });

  return React.useMemo(
    (): Intl.DateTimeFormat =>
      new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
      }),
    [timezone]
  );
};
