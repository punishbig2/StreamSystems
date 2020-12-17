import { Leg } from "components/MiddleOffice/types/leg";
import { DealEntry } from "structures/dealEntry";
import { InvalidTenor, Tenor } from "types/tenor";

export const legsReducer = (
  index: number,
  partial: Partial<DealEntry>
): ((leg: Leg, field: string) => Leg) => (leg: Leg, field: string): Leg => {
  const key: keyof DealEntry = field as keyof DealEntry;
  switch (key) {
    case "tenor1":
      const tenor: Tenor | InvalidTenor | undefined = partial[key];
      if (tenor !== undefined) {
        return {
          ...leg,
          deliveryDate: tenor.deliveryDate,
          expiryDate: tenor.expiryDate,
        };
      }
      break;
    case "tenor2":
      if (index === 1) {
        const tenor: string | Tenor | undefined | null = partial[key];
        if (typeof tenor === "string") return leg;
        if (tenor !== undefined && tenor !== null) {
          return {
            ...leg,
            deliveryDate: tenor.deliveryDate,
            expiryDate: tenor.expiryDate,
          };
        }
      }
      break;
    case "not1":
      return { ...leg, notional: partial[key] };
    case "not2":
      if (index !== 1) return leg;
      return { ...leg, notional: partial[key] };
    case "premstyle":
      return { ...leg };
    case "deltastyle":
      return { ...leg };
    case "dealstrike":
      return { ...leg, strike: partial[key] };
    default:
      return leg;
  }
  return leg;
};
