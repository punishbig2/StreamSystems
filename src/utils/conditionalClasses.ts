type BoolMap = { [key: string]: boolean };
export const toClassName = (...args: ReadonlyArray<string | BoolMap>): string => {
  return args
    .map((item: string | BoolMap): string => {
      if (typeof item === 'string') {
        return item;
      } else {
        const entries: ReadonlyArray<[string, boolean]> = Object.entries(item);
        return entries
          .filter(([, enabled]: [string, boolean]): boolean => enabled)
          .map(([name]: [string, boolean]) => name)
          .join(' ');
      }
    })
    .join(' ');
};
