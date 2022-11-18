export const parseVersionNumber = (versionNumber: string): number => {
  const trimmed = versionNumber.trim();

  const regexp = /^v(\d+)(?:\.(\d+))*$/;
  if (!regexp.test(trimmed)) throw new Error(`cannot parse version number '${versionNumber}'`);

  const parsed = trimmed
    .slice(1)
    .split('.')
    .map((digit: string): string => digit.padStart(2, '0'))
    .join('');

  return parseInt(parsed, 16);
};
