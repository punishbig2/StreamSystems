import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { createLegsFromDefinition } from "legsUtils";
import moStore from "mobx/stores/moStore";
import moment from "moment";
import { useEffect } from "react";
import { DealEntry } from "structures/dealEntry";
import { Symbol } from "types/symbol";
import { coalesce } from "utils";

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
  const newLegs: Leg[] = legs.map(
    (leg: Leg, index: number): Leg => {
      const notional: number = coalesce(
        index === 1 ? entry.not2 : entry.not1,
        entry.not1
      );
      const expiryDate: moment.Moment = coalesce(
        index === 1 ? entry.tenor2expiry : entry.tenor1expiry,
        entry.tenor1expiry
      );
      if (index === 1) {
        console.log("leg1", entry.not1, entry.not2, expiryDate.format());
      }
      const deliveryDate: moment.Moment = moment(expiryDate).add(
        Number(symbol.SettlementWindow),
        "d"
      );
      return {
        ...leg,
        notional: notional,
        strike: entry.dealstrike,
        expiryDate: expiryDate,
        deliveryDate: deliveryDate,
      };
    }
  );
  // Update the moStore store
  moStore.setLegs(newLegs, null);
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
