import { Leg } from 'components/MiddleOffice/types/leg';
import { DealEntry } from 'types/dealEntry';
import { FXSymbol } from 'types/FXSymbol';
import { Sides } from 'types/sides';
import { InvalidTenor, Tenor } from 'types/tenor';
import { coalesce } from 'utils/commonUtils';
import { getTenor } from 'utils/dealUtils';

export const initializeLegFromEntry = async (
  entry: DealEntry,
  originalLeg: Leg,
  symbol: FXSymbol,
  legIndex: number
): Promise<Partial<Leg>> => {
  const tenor: Tenor | InvalidTenor = getTenor(entry, legIndex);
  return {
    notional: coalesce(
      originalLeg.notional,
      legIndex === 1 && entry.not2 !== null ? entry.not2 : entry.not1
    ),
    vol: coalesce(originalLeg.vol, entry.vol),
    strike: coalesce(originalLeg.strike, entry.dealstrike),
    expiryDate: coalesce(originalLeg.expiryDate, tenor.expiryDate),
    deliveryDate: coalesce(originalLeg.expiryDate, tenor.deliveryDate),
    premiumDate: coalesce(originalLeg.premiumDate, entry.premiumDate),
    party: originalLeg.side === Sides.Buy ? entry.buyer : entry.seller,
  };
};
