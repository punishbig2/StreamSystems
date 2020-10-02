import { Leg } from "components/MiddleOffice/types/leg";
import { DealEntry } from "structures/dealEntry";
import { Sides } from "types/sides";
import { Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { getTenor } from "utils/dealUtils";

export const initializeLegFromEntry = async (
  entry: DealEntry,
  originalLeg: Leg,
  symbol: Symbol,
  legIndex: number
): Promise<Partial<Leg>> => {
  const tenor: Tenor | InvalidTenor = getTenor(entry, legIndex);
  return {
    notional: legIndex === 1 && entry.not2 !== null ? entry.not2 : entry.not1,
    vol: entry.vol,
    strike: entry.dealstrike,
    expiryDate: tenor.expiryDate,
    deliveryDate: tenor.deliveryDate,
    premiumDate: entry.premiumDate,
    party: originalLeg.side === Sides.Buy ? entry.buyer : entry.seller,
  };
};
