export const priceFormatter = (value: number | null): string => {
  if (value === null) return "";
  return value.toLocaleString(undefined, {
    useGrouping: true,
    maximumFractionDigits: 3,
    minimumFractionDigits: 0,
  });
};
