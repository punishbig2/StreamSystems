import { observe } from 'mobx';
import { DateTimeFormatStore } from 'mobx/stores/dateTimeFormatStore';
import React from 'react';

export const useTimeFormat = (): Intl.DateTimeFormat => {
  const store = React.useContext<DateTimeFormatStore>(DateTimeFormatStore.Context);
  const [timezone, setTimezone] = React.useState<string>(store.currentTimezone);

  observe(store, 'currentTimezone', (): void => {
    setTimezone(store.currentTimezone);
  });

  return React.useMemo(
    (): Intl.DateTimeFormat =>
      new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
      }),
    [timezone]
  );
};
