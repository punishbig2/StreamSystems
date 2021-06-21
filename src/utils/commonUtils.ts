import { themeStore } from "mobx/stores/themeStore";
import { OrderTypes } from "types/mdEntry";
import { Sides } from "types/sides";
import timezones, { TimezoneInfo } from "data/timezones";
import { toNumber } from "utils/isNumeric";

export const coalesce = (value: any, defaultValue: any): any => {
  if (value === null || value === undefined || value === "")
    return defaultValue;
  return value;
};

export const getSideFromType = (type: OrderTypes): Sides => {
  switch (type) {
    case OrderTypes.Bid:
      return Sides.Buy;
    case OrderTypes.Ofr:
      return Sides.Sell;
    default:
      throw new Error("wrong type, it has no sensible side");
  }
};

export const findDefaultTimezone = () => {
  const formatter: Intl.DateTimeFormat = Intl.DateTimeFormat();
  const options: Intl.ResolvedDateTimeFormatOptions =
    formatter.resolvedOptions();
  const browserTimezone = options.timeZone;
  const found: TimezoneInfo | undefined = timezones.find(
    ({ text }: TimezoneInfo) => {
      return text === browserTimezone;
    }
  );
  if (found === undefined) {
    return "America/New_York" /* sensible default */;
  } else {
    return found.text;
  }
};

export const percent = (
  numerator: number,
  denominator: number,
  base: number
): string => {
  const percent: number = numerator / denominator;
  return `${percent * base}ex`;
};

export const getCurrentTime = (): string => Math.round(Date.now()).toString();

export const updateApplicationTheme = (
  theme: string,
  colorScheme: string,
  font: string
) => {
  void colorScheme;
  void font;
  themeStore.setTheme(theme as "light" | "dark");
};

export const selectInputText = (input: HTMLInputElement) =>
  input && input.select();

/// FIXME: what?
export const tryToNumber = (
  value: string | number | ((...args: any[]) => any) | null
): string | null => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  if (typeof value === "number") return value.toString();
  const asNumber: number | null | undefined = toNumber(value);
  if (asNumber !== null && asNumber !== undefined && !isNaN(asNumber))
    return asNumber.toString();
  return value.toUpperCase();
};

export const floatAsString = (value: number | string | null): string | null => {
  if (typeof value === "number") return value.toString();
  return value;
};
