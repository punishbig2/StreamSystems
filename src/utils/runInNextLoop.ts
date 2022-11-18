export const runInNextLoop = <R = void>(fn: (...args: readonly any[]) => R): void => {
  setTimeout(fn, 0);
};
