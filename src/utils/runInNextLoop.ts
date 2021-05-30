export const runInNextLoop = <R = void>(
  fn: (...args: ReadonlyArray<any>) => R
) => {
  setTimeout(fn, 0);
};
