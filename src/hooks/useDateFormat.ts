import React from "react";
import { DateTimeFormatStore } from "mobx/stores/dateTimeFormatStore";
import { observe } from "mobx";

export const useDateFormat = (): Intl.DateTimeFormat => {
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
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    [timezone]
  );
};
