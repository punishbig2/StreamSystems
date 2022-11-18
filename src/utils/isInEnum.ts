import { CCYPair, RRStrategy } from 'data/groups';

export const isRRStrategy = (value: any): value is RRStrategy => {
  const values: string[] = Object.values(RRStrategy);
  return values.includes(value);
};

export const isCCYPair = (value: any): value is CCYPair => {
  const values: string[] = Object.values(CCYPair);
  return values.includes(value);
};
