import { Globals } from "golbals";

export const priceFormatter = (value: number | null): string => {
  if (value === null) return "";
  return value.toLocaleString(Globals.locale, {
    useGrouping: true,
    maximumFractionDigits: 3,
    minimumFractionDigits: 2,
  });
};
