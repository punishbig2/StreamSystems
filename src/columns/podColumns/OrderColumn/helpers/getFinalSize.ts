export const getFinalSize = (submittedSize: number | null, defaultSize: number): number => {
  if (submittedSize !== null)
    return submittedSize;
  return defaultSize;
};
