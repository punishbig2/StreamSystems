export const DecimalSeparator = (0.1)
  .toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  .substr(-2, 1);

export const toNumber = (value: string | null): number | null | undefined => {
  if (value === null) return null;
  const fragments: string[] = value.split(DecimalSeparator);
  if (fragments.length === 2) {
    const integer: string = fragments[0].replace(/[^0-9]+/g, "");
    const decimal: string = fragments[1].replace(/[^0-9]+/g, "");
    if (integer.length === 0) return undefined;
    if (decimal.length === 0) {
      const numeric: number = Number(integer);
      if (isNaN(numeric)) return undefined;
      return numeric;
    } else {
      const numeric: number = Number([integer, decimal].join("."));
      if (isNaN(numeric)) return undefined;
      return numeric;
    }
  } else if (fragments.length === 1) {
    const integer: string = fragments[0].replace(/[^0-9]+/g, "");
    if (integer.length === 0) return undefined;
    const numeric: number = Number(integer);
    if (isNaN(numeric)) return undefined;
    return numeric;
  } else {
    return undefined;
  }
};

export const isNumeric = (value: string): boolean =>
  toNumber(value) !== undefined;
