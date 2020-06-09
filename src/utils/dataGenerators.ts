import { PodRow } from "interfaces/podRow";

/*export const emptyEntry = (tenor: string, symbol: string, strategy: string, user: string, size: number | null, type: OrderTypes): Order => {
  return new Order(tenor, symbol, strategy, user, size, type);
};

export const emptyOffer = (tenor: string, symbol: string, strategy: string, user: string, size: number | null = null): Order => {
  return emptyEntry(tenor, symbol, strategy, user, size, OrderTypes.Offer);
};

export const emptyBid = (tenor: string, symbol: string, strategy: string, user: string, size: number | null = null): Order => {
  return emptyEntry(tenor, symbol, strategy, user, size, OrderTypes.Bid);
};*/

export const tenorToNumber = (value: string) => {
  // FIXME: probably search the number boundary
  const multiplier: number = Number(value.substr(0, value.length - 1));
  const unit: string = value.substr(-1, 1);
  switch (unit) {
    case "D":
      return multiplier;
    case "W":
      return 7 * multiplier;
    case "M":
      return 30 * multiplier;
    case "Y":
      return 365 * multiplier;
  }
  return 0;
};

export const compareTenors = (a: PodRow, b: PodRow) => {
  const at: string = a.tenor;
  const bt: string = b.tenor;
  return tenorToNumber(at) - tenorToNumber(bt);
};
