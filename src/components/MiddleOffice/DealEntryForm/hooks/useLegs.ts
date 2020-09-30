import { API, Task } from "API";
import { isInvalidTenor } from "components/FormField/helpers";
import { Cut } from "components/MiddleOffice/types/cut";
import { Leg } from "components/MiddleOffice/types/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/types/legOptionsDef";
import { InvalidStrategy, MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { createLegsFromDefinitionAndDeal, parseDates } from "utils/legsUtils";
import moStore from "mobx/stores/moStore";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";
import { DealEntry } from "structures/dealEntry";
import { PricingMessage } from "types/pricingMessage";
import { Sides } from "types/sides";
import { InvalidSymbol, Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { coalesce } from "utils/commonUtils";

const buildSummaryLegFromCut = (
  cut: Cut,
  strategy: MOStrategy,
  symbol: Symbol,
  tradeDate: Date,
  premiumDate: Date,
  spotDate: Date,
  deliveryDate: Date | undefined,
  expiryDate: Date
): SummaryLeg => {
  return {
    fwdpts1: null,
    fwdrate1: null,
    fwdpts2: null,
    fwdrate2: null,
    cutCity: cut.City,
    cutTime: cut.LocalTime,
    dealOutput: {
      premiumDate: premiumDate,
      deliveryDate: deliveryDate !== undefined ? deliveryDate : new Date(),
      expiryDate: expiryDate,
      side: Sides.None,
      option: "",
      vol: null,
      fwdPts: null,
      fwdRate: null,
      premium: [null, null, null],
      strike: null,
      delta: [null, null, null],
      gamma: null,
      hedge: [null, null, null],
      price: [null, null, null],
      vega: null,
      premiumCurrency: "USD",
      usi_num: null,
      rates: [
        {
          currency: "",
          value: 0,
        },
        {
          currency: "",
          value: 0,
        },
      ],
    },
    delivery: symbol.SettlementType,
    source: symbol.FixingSource,
    spot: null,
    spotDate: spotDate,
    tradeDate: tradeDate,
    usi: null,
    strategy: strategy.description,
  };
};

const createSummaryLeg = (
  cuts: ReadonlyArray<Cut>,
  strategy: MOStrategy,
  symbol: Symbol,
  tradeDate: Date,
  premiumDate: Date,
  spotDate: Date,
  deliveryDate: Date | undefined,
  expiryDate: Date
): SummaryLeg | null => {
  const cut: Cut | undefined = cuts.find((cut: Cut) => {
    return (
      cut.Code === symbol.PrimaryCutCode &&
      cut.UTCTime === symbol.PrimaryUTCTime
    );
  });
  if (cut !== undefined) {
    return buildSummaryLegFromCut(
      cut,
      strategy,
      symbol,
      tradeDate,
      premiumDate,
      spotDate,
      deliveryDate,
      expiryDate
    );
  } else {
    return null;
  }
};

const handleLegsResponse = (
  entry: DealEntry,
  legs: ReadonlyArray<Leg>,
  cuts: ReadonlyArray<Cut>
): void => {
  const { summaryLeg } = moStore;
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return;
  if (legs[0].option === "SumLeg" || legs.length === 1) {
    const fwdPts: number | null =
      summaryLeg !== null ? summaryLeg.fwdpts1 : null;
    const fwdRate: number | null =
      summaryLeg !== null ? summaryLeg.fwdrate1 : null;
    moStore.setLegs(
      legs.slice(legs.length === 1 ? 0 : 1),
      {
        ...createSummaryLeg(
          cuts,
          entry.strategy,
          entry.symbol,
          entry.tradeDate,
          entry.premiumDate,
          entry.spotDate,
          tenor.deliveryDate,
          tenor.expiryDate
        ),
        ...summaryLeg,
        fwdpts1: coalesce(legs[1].fwdPts, fwdPts),
        fwdrate1: coalesce(legs[1].fwdRate, fwdRate),
        fwdpts2: coalesce(
          // The legs[1] generally equals legs[0]
          legs[2] !== undefined ? legs[2].fwdPts : undefined,
          fwdPts
        ),
        fwdrate2: coalesce(
          // The legs[1] generally equals legs[0]
          legs[2] !== undefined ? legs[2].fwdRate : undefined,
          fwdRate
        ),
        spot: legs[0].spot,
        usi: entry.usi,
        ...{ dealOutput: legs[0] },
      } as SummaryLeg,
      true
    );
  } else {
    moStore.setLegs(legs, createSummaryLeg(
      cuts,
      entry.strategy,
      entry.symbol,
      entry.tradeDate,
      entry.premiumDate,
      entry.spotDate,
      tenor.deliveryDate,
      tenor.expiryDate
    ),);
  }
};

const createDefaultLegsFromDeal = (
  cuts: ReadonlyArray<Cut>,
  entry: DealEntry
): void => {
  const { strategy, symbol } = entry;
  // Special ground state case (the second one is not what I expected)
  if (
    strategy === InvalidStrategy ||
    strategy.productid === "" ||
    symbol === InvalidSymbol ||
    symbol.symbolID === ""
  ) {
    return;
  }
  // We should be able to find it now
  const legDefinitions: { in: LegOptionsDefIn[] } | undefined =
    moStore.legDefinitions[strategy.productid];
  if (!legDefinitions) {
    console.warn(`no leg definitions found for ${strategy.productid}`);
    console.warn(
      "strategies with definitions are: ",
      Object.keys(moStore.legDefinitions)
    );
    // Unset legs
    moStore.setLegs([], null);
    return;
  }
  const legs: ReadonlyArray<Leg> = createLegsFromDefinitionAndDeal(
    legDefinitions.in,
    entry
  );
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return;
  moStore.setLegs(
    legs,
    createSummaryLeg(
      cuts,
      entry.strategy,
      entry.symbol,
      entry.tradeDate,
      entry.premiumDate,
      entry.spotDate,
      tenor.deliveryDate,
      tenor.expiryDate
    )
  );
};

const populateExistingDealLegsAndInstallListener = (
  cuts: ReadonlyArray<Cut>,
  entry: DealEntry
): (() => void) => {
  // Query the legs, they could not exist too
  const task: Task<any> = API.getLegs(entry.dealID);
  task
    .execute()
    .then((response: any) => {
      if (response !== null) {
        if ("dealId" in response) {
          const legs: ReadonlyArray<Leg> = parseDates(response.legs);
          // Handle legs and populate from response
          handleLegsResponse(entry, legs, cuts);
        } else {
          // If there's an error, we must show it
          if ("error_msg" in response) {
            moStore.setError({
              status: "Server error",
              error: "Unexpected Error",
              content: response.error_msg,
              code: 500,
            });
          } else {
            createDefaultLegsFromDeal(cuts, entry);
          }
        }
      } else {
        createDefaultLegsFromDeal(cuts, entry);
      }
    })
    .catch((reason: any) => {
      if (reason !== "aborted") {
        createDefaultLegsFromDeal(cuts, entry);
      }
    });
  const removePricingListener: () => void = signalRManager.addPricingResponseListener(
    (data: PricingMessage) => {
      if (entry.dealID === data.dealId) {
        // It is the deal of interest so update
        // visible legs now
        handleLegsResponse(entry, parseDates(data.legs), cuts);
      }
    }
  );
  return () => {
    removePricingListener();
    task.cancel();
  };
};

export default (cuts: ReadonlyArray<Cut>, entry: DealEntry) => {
  useEffect(() => {
    if (entry.dealID === "") {
      return createDefaultLegsFromDeal(cuts, entry);
    } else {
      return populateExistingDealLegsAndInstallListener(cuts, entry);
    }
  }, [cuts, entry]);
};
