import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { Symbol } from "types/symbol";
import { createLegsFromDefinition } from "legsUtils";
import moStore from "mobx/stores/moStore";
import { isMoment } from "moment";
import { useEffect } from "react";
import { DealEntry } from "structures/dealEntry";
import moment from "moment";
import { tenorToDuration } from "utils/tenorUtils";

const createStubLegs = async (
  entry: DealEntry,
  cuts: ReadonlyArray<Cut>
): Promise<void> => {
  if (entry.strategy === "") return;
  const symbol: Symbol = moStore.findSymbolById(entry.ccypair);
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
  // FIXME: this is probably right, but not sure as there could be more than 1 tenor
  const expiryDate: moment.Moment = isMoment(entry.tenor1)
    ? entry.tenor1
    : tradeDate.add(tenorToDuration(entry.tenor1));
  const deliveryDate: moment.Moment = moment(expiryDate).add(
    Number(symbol.SettlementWindow),
    "d"
  );
  // Update the moStore store
  moStore.setLegs(
    legs.map(
      (leg: Leg): Leg => {
        return {
          ...leg,
          notional: entry.not1,
          strike: entry.dealstrike,
          expiryDate: expiryDate,
          deliveryDate: deliveryDate,
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

export default (cuts: ReadonlyArray<Cut>, entry: DealEntry) => {
  useEffect(() => {
    moStore.setLegs([], null);
  }, [entry.strategy]);
  useEffect(() => {
    if (entry.ccypair === "") return;
    createStubLegs(entry, cuts).then(() => {});
  }, [cuts, entry]);
};
