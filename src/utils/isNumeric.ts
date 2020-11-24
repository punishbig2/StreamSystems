import { Globals } from "golbals";

export const DecimalSeparator = (0.1)
  .toLocaleString(Globals.locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  .substr(-2, 1);
export const ThousandsSeparator = (1000000)
  .toLocaleString(Globals.locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    useGrouping: true,
  })
  .substr(1, 1);

/**
 * The dot is a special value in regular expression engines so we are making
 * sure that when appropriate the correct regular expression is generated
 * @param value
 * @param greedy
 */
const getSeparatorRegexp = (
  value: string,
  greedy: boolean
): string | RegExp => {
  if (value === ".") {
    if (greedy) {
      return /\./g;
    } else {
      return /\./;
    }
  }
  return new RegExp(value, greedy ? "g" : undefined);
};

const getDecimalSeparatorForRegexp = (): string | RegExp => {
  return getSeparatorRegexp(DecimalSeparator, false);
};

const getThousandsSeparatorRegexp = (): string | RegExp => {
  return getSeparatorRegexp(ThousandsSeparator, true);
};

export const toNumber = (
  value: string | null,
  currency?: string
): number | null | undefined => {
  if (value === null) return null;
  const separator: string | RegExp = getDecimalSeparatorForRegexp();
  const fragments: string[] = value
    .replace(
      currency === undefined ? " " /* it seems safe to do this */ : currency,
      ""
    )
    .trim()
    .split(separator);
  if (fragments.length === 2) {
    const integer: string = fragments[0].replace(
      getThousandsSeparatorRegexp(),
      ""
    );
    const decimal: string = fragments[1].replace(
      getThousandsSeparatorRegexp(),
      ""
    );
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
    const integer: string = fragments[0].replace(
      getThousandsSeparatorRegexp(),
      ""
    );
    const numeric: number = Number(integer);
    if (isNaN(numeric)) return undefined;
    return numeric;
  } else {
    return undefined;
  }
};

export const isNumeric = (value: string | number): boolean => {
  if (typeof value === "number") return true;
  return toNumber(value) !== undefined;
};
