export const isNumber = (value?: number | null): value is number =>
  !(value === null || value === undefined);
