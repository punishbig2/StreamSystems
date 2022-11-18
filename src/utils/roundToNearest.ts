import { Validity } from 'forms/validity';
import { Globals } from 'golbals';

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
  if (value === null) return ['', Validity.Intermediate];
  if (reference === undefined) {
    return [value.toString(), Validity.Valid];
  }
  const precision: number = getRoundingPrecision(reference);
  const multiplier: number = Math.pow(10, precision);
  const multiplied: number = Math.round(value * multiplier);
  const divider: number = Math.round(reference * multiplier);
  const rounded: number = ((): number => {
    const down: number = Math.round(multiplied - (multiplied % divider));
    const up: number = down + divider;
    if (multiplied - down > up - multiplied) {
      return up / multiplier;
    } else {
      return down / multiplier;
    }
  })();
  const options = {
    maximumFractionDigits: precision,
    minimumFractionDigits: precision,
  };
  return [rounded.toLocaleString(Globals.locale, options), Validity.Valid];
};
