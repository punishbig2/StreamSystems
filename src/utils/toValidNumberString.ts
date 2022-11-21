const formatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 5,
  minimumFractionDigits: 5,
});

export function toValidNumberStringSmart(value: undefined | null): null | undefined;

export function toValidNumberStringSmart(value: number): string;

export function toValidNumberStringSmart(
  value: number | null | undefined
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return formatter.format(value);
}

export function toValidNumberStringDumb(
  value: number | null | undefined
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return formatter.format(value);
}
