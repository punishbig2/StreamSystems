import { Validity } from "forms/validity";

export const getRoundingPrecision = (value: number | undefined): number => {
  if (value === undefined) return 0;
  const asString: string = value.toString();
  const parts: string[] = asString.split(/[^0-9]/);
  if (parts.length < 2) return 0;
  return parts[1].length;
};

export const roundToNearest = (
  value: number | null,
  reference: number | undefined
): [string, Validity] => {
  if (value === null) return ["", Validity.Intermediate];
  if (reference === undefined) {
    return [value.toString(), Validity.Valid];
  }
  const precision: number = getRoundingPrecision(reference);
  const multiplier: number = Math.pow(10, precision);
  const multiplied: number = value * multiplier;
  const divider: number = reference * multiplier;
  const rounded: number = (multiplied - (multiplied % divider)) / multiplier;
  const options = {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  };
  return [rounded.toLocaleString(undefined, options), Validity.Valid];
};
