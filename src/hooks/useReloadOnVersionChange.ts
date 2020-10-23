import React from "react";

export const useReloadOnVersionChange = (): void => {
  const [version, setVersion] = React.useState<string | null>(null);
  React.useEffect((): (() => void) | void => {
    const timer = setInterval((): void => {
      fetch("/version.txt")
        .then((response): Promise<string> => response.text())
        .then((value: string): void => {
          if (version === null) {
            setVersion(value);
          } else if (value !== version) {
            window.location.reload();
          }
        });
    }, 2000);
    return (): void => clearTimeout(timer);
  });
};
