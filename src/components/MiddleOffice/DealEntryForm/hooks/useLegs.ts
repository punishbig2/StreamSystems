import { useEffect } from "react";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Deal } from "components/MiddleOffice/interfaces/deal";
import { LegOptionsDefOut } from "components/MiddleOffice/interfaces/legOptionsDef";
import MO from "mobx/stores/moStore";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { createLegsFromDefinition } from "legsUtils";

const createStubLegs = async (deal: Deal, cuts: Cut[]): Promise<void> => {
  const { symbol } = deal;
  // const strategy: MOStrategy = MO.getStrategyById(deal.strategy);
  const legDefinitions: { out: LegOptionsDefOut[] } | undefined =
    MO.legDefinitions[deal.strategy];
  if (!legDefinitions) return;
  const legs: Leg[] = createLegsFromDefinition(
    deal,
    legDefinitions.out,
  );
  // Update the MO store
  MO.setLegs(legs, null);
  const cut: Cut | undefined = cuts.find((cut: Cut) => {
    return (
      cut.Code === symbol.PrimaryCutCode &&
      cut.UTCTime === symbol.PrimaryUTCTime
    );
  });
  if (cut !== undefined) {
    MO.createSummaryLeg(cut);
  } else {
    console.warn("cannot determine the cut city for this deal");
  }
};

export default (cuts: Cut[], deal: Deal | null) => {
  useEffect(() => {
    if (deal === null) return;
    createStubLegs(deal, cuts).then(() => {});
  }, [cuts, deal]);
};
