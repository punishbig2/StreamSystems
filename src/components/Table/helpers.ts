export const getCellWidth = (weight: number, total: number): string => {
  return (100 * weight) / total + '%';
};
