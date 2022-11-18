export type StyledValue = [number | null, number | null, number | null];

export const isStyledValue = (value: any): value is StyledValue => {
  if (value === null || value === undefined) return false;
  if (value.length === undefined) return false;
  switch (value.length) {
    case 2:
      if (value[0] !== null && typeof value[0] !== 'number') return false;
      return !(value[1] !== null && typeof value[1] !== 'number');
    case 3:
      if (value[0] !== null && typeof value[0] !== 'number') return false;
      if (value[1] !== null && typeof value[1] !== 'number') return false;
      return !(value[2] !== null && typeof value[2] !== 'number');
    default:
      return false;
  }
};
