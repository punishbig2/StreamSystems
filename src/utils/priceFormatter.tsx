export const priceFormatter = (value: number | null): string => {
  if (value === null) return "";
  if (typeof value.toFixed !== "function") {
    return "";
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  });
};
