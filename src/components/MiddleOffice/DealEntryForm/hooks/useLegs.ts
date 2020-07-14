import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { Symbol } from "interfaces/symbol";
import { createLegsFromDefinition } from "legsUtils";
import moStore from "mobx/stores/moStore";
import { isMoment } from "moment";
import { useEffect } from "react";
import { DealEntry } from "structures/dealEntry";
import moment from "moment";
import { tenorToDuration } from "utils/dataGenerators";

const createStubLegs = async (entry: DealEntry, cuts: Cut[]): Promise<void> => {
  const symbol: Symbol = moStore.findSymbolById(entry.currencyPair);
  const legDefinitions: { in: LegOptionsDefIn[] } | undefined =
    moStore.legDefinitions[entry.strategy];
  if (!legDefinitions) {
    console.warn(`no leg definitions found for ${entry.strategy}`);
    console.warn("available strategies are: ", moStore.legDefinitions);
    return;
  }
  const storeLegs: Leg[] = moStore.legs;
  const legs: Leg[] =
    storeLegs.length > 0
      ? storeLegs
      : createLegsFromDefinition(entry, legDefinitions.in, symbol);
  const deal: Deal | null = moStore.deal;
  const tradeDate: moment.Moment =
    deal !== null ? moment(deal.tradeDate) : moment();
  const expiryDate: moment.Moment = isMoment(entry.tenor)
    ? entry.tenor
    : tradeDate.add(tenorToDuration(entry.tenor));
  // Update the moStore store
  moStore.setLegs(
    legs.map(
      (leg: Leg): Leg => {
        console.log(leg.expiryDate.format(), expiryDate.format());
        return {
          ...leg,
          vol: entry.vol,
          notional: entry.notional,
          strike: entry.strike,
          expiryDate: expiryDate,
          deliveryDate: deal !== null ? deal.deliveryDate : moment(),
        };
      }
    ),
    null
  );
  const cut: Cut | undefined = cuts.find((cut: Cut) => {
    return (
      cut.Code === symbol.PrimaryCutCode &&
      cut.UTCTime === symbol.PrimaryUTCTime
    );
  });
  if (cut !== undefined) {
    moStore.createSummaryLeg(cut);
  } else {
    console.warn("cannot determine the cut city for this deal");
  }
};

export default (cuts: Cut[], entry: DealEntry) => {
  useEffect(() => {
    if (entry.currencyPair === "") return;
    createStubLegs(entry, cuts).then(() => {});
  }, [cuts, entry]);
};
