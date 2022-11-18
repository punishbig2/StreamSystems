import { PodRow } from 'types/podRow';

export const SPECIFIC_TENOR = 'SPECIFIC';

export const tenorToNumber = (value: string): number => {
  // FIXME: probably search the number boundary
  const multiplier = Number(value.substr(0, value.length - 1));
  const unit: string = value.substr(-1, 1);
  switch (unit) {
    case 'D':
      return multiplier;
    case 'W':
      return 7 * multiplier;
    case 'M':
      return 30 * multiplier;
    case 'Y':
      return 365 * multiplier;
  }
  return 0;
};

export const compareTenors = (a: PodRow, b: PodRow): number => {
  const at: string = a.tenor;
  const bt: string = b.tenor;
  return tenorToNumber(at) - tenorToNumber(bt);
};
