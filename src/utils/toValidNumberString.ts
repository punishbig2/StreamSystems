export function toValidNumberStringSmart(value: undefined | null): null | undefined;

export function toValidNumberStringSmart(value: number): string;

export function toValidNumberStringSmart(
  value: number | null | undefined
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.toFixed(5);
}

export function toValidNumberStringDumb(
  value: number | null | undefined
): string | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return value.toFixed(5);
}
