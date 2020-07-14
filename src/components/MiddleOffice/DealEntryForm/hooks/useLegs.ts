import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { Symbol } from "interfaces/symbol";
import { createLegsFromDefinition } from "legsUtils";
import moStore from "mobx/stores/moStore";
import { useEffect } from "react";
import { DealEntry } from "structures/dealEntry";

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
  // Update the moStore store
  moStore.setLegs(
    legs.map(
      (leg: Leg): Leg => {
        return {
          ...leg,
          notional: entry.notional,
          vol: entry.vol,
          strike: entry.strike,
          /// FIXME: Expiry date could be computed from the tenor
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
