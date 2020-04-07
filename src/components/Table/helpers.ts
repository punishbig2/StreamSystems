export const getCellWidth = (weight: number, total: number, maximum: number): string => {
  return (100 * weight / total) + '%';
};
