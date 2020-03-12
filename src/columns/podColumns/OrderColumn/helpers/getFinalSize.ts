export const getFinalSize = (submittedSize: number | null, orderSize: number | null, defaultSize?: number): number => {
  // If a size was submitted use it
  if (submittedSize !== null)
    return submittedSize;
  // Otherwise use current order's size
  if (orderSize !== null)
    return orderSize;
  // Finally use the default size
  if (defaultSize === undefined)
    throw new Error('impossible to determine order creation size');
  return defaultSize;
};
