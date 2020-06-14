import { useEffect } from "react";
import { LegOptionsDef } from "components/MiddleOffice/interfaces/legOptionsDef";
import middleOfficeStore, { StubLegInfo } from "mobx/stores/middleOfficeStore";
import { Sides } from "interfaces/sides";
import { Symbol } from "interfaces/symbol";
import workareaStore from "mobx/stores/workareaStore";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { DealEntry } from "structures/dealEntry";

export default (
  cuts: Cut[],
  entry: DealEntry,
  legOptionsDefs: { [strategy: string]: LegOptionsDef[] }
) => {
  useEffect(() => {
    const { strategy, notional, buyer, seller, vol, strike, currency } = entry;
    const legDefinitions: LegOptionsDef[] | undefined =
      legOptionsDefs[strategy];
    if (!legDefinitions) return;
    // First clean it up
    middleOfficeStore.resetLegs();
    // Now fill the stub legs
    for (const legDefinition of legDefinitions) {
      const side: Sides =
        legDefinition.ReturnSide === "buy" ? Sides.Buy : Sides.Sell;
      const legData: StubLegInfo = {
        notional:
          notional === null ? null : notional * legDefinition.notional_ratio,
        party: side === Sides.Buy ? buyer : seller,
        side: side,
        vol: vol,
        strike: strike,
        option: legDefinition.OptionLegIn,
        currencies: [currency.slice(0, 3), currency.slice(3)],
      };
      middleOfficeStore.addStubLeg(legData);
    }
    const symbol: Symbol | undefined = workareaStore.findSymbolById(currency);
    if (symbol !== undefined) {
      const cut: Cut | undefined = cuts.find((cut: Cut) => {
        return (
          cut.Code === symbol.PrimaryCutCode &&
          cut.UTCTime === symbol.PrimaryUTCTime
        );
      });
      if (cut !== undefined) {
        middleOfficeStore.createSummaryLeg(entry, cut, symbol);
      } else {
        console.warn("cannot determine the cut city for this deal");
      }
    }
  }, [cuts, entry, legOptionsDefs]);
};
