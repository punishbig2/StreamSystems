import React from "react";
import workareaStore from "../mobx/stores/workareaStore";

export const useReloadOnVersionChange = (): void => {
  const [version, setVersion] = React.useState<string | null>(null);
  const [hasUpdates, setHasUpdates] = React.useState<boolean>(false);
  React.useEffect((): (() => void) | void => {
    if (hasUpdates) {
      workareaStore.setHasUpdates();
    } else {
      const timer = setInterval((): void => {
        fetch("/version.txt")
          .then((response): Promise<string> => response.text())
          .then((value: string): void => {
            if (version === null) {
              setVersion(value);
            } else if (value !== version) {
              // FIXME: show a notification
              setHasUpdates(true);
            }
          });
      }, 180000);
      return (): void => clearTimeout(timer);
    }
  }, [version, hasUpdates]);
};
