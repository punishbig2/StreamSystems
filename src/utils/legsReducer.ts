import { isTenor } from "components/FormField/helpers";
import { Leg } from "components/MiddleOffice/types/leg";
import { DealEntry } from "types/dealEntry";
import { tryToNumber } from "utils/commonUtils";
import { isNumeric } from "utils/isNumeric";

const isNotional = (value: any): value is number | undefined | null => {
  return (
    typeof value === "number" ||
    (typeof value === "string" && isNumeric(value)) ||
    value === undefined ||
    value === null
  );
};

export const legsReducer =
  (
    index: number,
    partial: Partial<DealEntry>,
    entry: DealEntry
  ): ((leg: Leg, field: string) => Leg) =>
  (leg: Leg, field: string): Leg => {
    const key: keyof DealEntry = field as keyof DealEntry;
    const value = partial[key];
    switch (key) {
      case "tenor1":
        if (isTenor(value)) {
          return {
            ...leg,
            deliveryDate: value.deliveryDate,
            expiryDate: value.expiryDate,
          };
        }
        break;
      case "tenor2":
        if (index === 1) {
          if (isTenor(value)) {
            return {
              ...leg,
              deliveryDate: value.deliveryDate,
              expiryDate: value.expiryDate,
            };
          }
        }
        break;
      case "not1":
        if (index === 0) {
          if (isNotional(value)) {
            return { ...leg, notional: value };
          } else {
            console.warn(`expecting '${value}' to be number`);
            return leg;
          }
        } else if (index === 1 && isNotional(value) && !isNumeric(entry.not2)) {
          return { ...leg, notional: value };
        } else {
          return leg;
        }
      case "not2":
        if (index !== 1) return leg;
        return {
          ...leg,
          notional: isNumeric(partial[key]) ? partial[key] : entry.not1,
        };
      case "premstyle":
        return { ...leg };
      case "deltastyle":
        return { ...leg };
      case "vol":
        if (
          (typeof value === "string" || typeof value === "number") &&
          isNumeric(value)
        ) {
          return { ...leg, vol: value };
        } else {
          return leg;
        }
      case "dealstrike":
        if (typeof value === "string") {
          const numeric = tryToNumber(value);
          return { ...leg, strike: numeric };
        } else if (typeof partial[key] === "number") {
          return { ...leg, strike: partial[key] };
        } else {
          return { ...leg, strike: partial[key] };
        }
      default:
        return leg;
    }
    return leg;
  };
