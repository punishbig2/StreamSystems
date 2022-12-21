export const toRelativeFontSize = (baseSize: number): string =>
  `calc(${baseSize / 30}vw + ${baseSize / 30}vh)`;
