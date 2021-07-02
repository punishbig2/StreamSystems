export const parseVersionNumber = (versionNumber: string): number => {
  const regexp = /^v(?:(\d+)\.)+(\d+)$/g;
  if (!regexp.test(versionNumber))
    throw new Error(`cannot parse version number '${versionNumber}'`);
  const parsed = versionNumber
    .slice(1)
    .split(".")
    .map((digit: string): string => digit.padStart(2, "0"))
    .join("");
  return parseInt(parsed, 16);
};
