export const DecimalSeparator = (0.1)
  .toLocaleString(undefined, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  .substr(-2, 1);

const getDecimalSeparatorForSplit = (): string | RegExp => {
  if (DecimalSeparator === ".") return /\\./;
  return DecimalSeparator;
};

export const toNumber = (value: string | null): number | null | undefined => {
  if (value === null) return null;
  const separator: string | RegExp = getDecimalSeparatorForSplit();
  const fragments: string[] = value.split(separator);
  if (fragments.length === 2) {
    const integer: string = fragments[0];
    const decimal: string = fragments[1];
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
    const integer: string = fragments[0];
    const numeric: number = Number(integer);
    if (isNaN(numeric)) return undefined;
    return numeric;
  } else {
    return undefined;
  }
};

export const isNumeric = (value: string): boolean =>
  toNumber(value) !== undefined;
