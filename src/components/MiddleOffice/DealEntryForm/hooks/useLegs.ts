import { API, Task } from "API";
import { Cut } from "components/MiddleOffice/types/cut";
import { Deal } from "components/MiddleOffice/types/deal";
import { Leg } from "components/MiddleOffice/types/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/types/legOptionsDef";
import { MOStrategy } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { createLegsFromDefinition, fixDates } from "legsUtils";
import moStore, { MOStatus } from "mobx/stores/moStore";
import moment from "moment";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";
import { DealEntry } from "structures/dealEntry";
import { Sides } from "types/sides";
import { Symbol } from "types/symbol";
import { coalesce } from "utils";

const buildSummaryLegFromCut = (
  cut: Cut,
  strategyId: string,
  symbol: Symbol,
  tradeDate: moment.Moment,
  spotDate: moment.Moment,
  deliveryDate: moment.Moment,
  expiryDate: moment.Moment
): SummaryLeg => {
  const strategy: MOStrategy = moStore.getStrategyById(strategyId);
  return {
    fwdpts1: null,
    fwdrate1: null,
    fwdpts2: null,
    fwdrate2: null,
    cutCity: cut.City,
    cutTime: cut.LocalTime,
    dealOutput: {
      premiumDate: spotDate,
      deliveryDate: deliveryDate,
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
  strategyId: string,
  symbol: Symbol,
  tradeDate: moment.Moment,
  spotDate: moment.Moment,
  deliveryDate: moment.Moment,
  expiryDate: moment.Moment
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
      strategyId,
      symbol,
      tradeDate,
      spotDate,
      deliveryDate,
      expiryDate
    );
  } else {
    return null;
  }
};

const createStubLegs = (
  strategy: string,
  cuts: ReadonlyArray<Cut>,
  symbol: Symbol
): ReadonlyArray<Leg> | null => {
  const legDefinitions: { in: LegOptionsDefIn[] } | undefined =
    moStore.legDefinitions[strategy];
  if (!legDefinitions) {
    console.warn(`no leg definitions found for ${strategy}`);
    console.warn("available strategies are: ", moStore.legDefinitions);
    return null;
  }
  const storeLegs: Leg[] = moStore.legs;
  return storeLegs.length > 0
    ? storeLegs
    : createLegsFromDefinition(legDefinitions.in, symbol);
};

const handleLegsResponse = (
  deal: Deal,
  legs: ReadonlyArray<Leg>,
  cuts: ReadonlyArray<Cut>
): void => {
  const { summaryLeg } = moStore;
  // FIXME: probably should throw
  if (legs[0].option === "SumLeg" || legs.length === 1) {
    const fwdPts: number | null =
      summaryLeg !== null ? summaryLeg.fwdpts1 : null;
    const fwdRate: number | null =
      summaryLeg !== null ? summaryLeg.fwdrate1 : null;
    moStore.setLegs(legs.slice(legs.length === 1 ? 0 : 1), {
      ...createSummaryLeg(
        cuts,
        deal.strategy,
        deal.symbol,
        deal.tradeDate,
        deal.spotDate,
        deal.deliveryDate,
        deal.expiry1
      ),
      ...summaryLeg,
      fwdpts1: coalesce(fwdPts, legs[0].fwdPts),
      fwdrate1: coalesce(fwdRate, legs[0].fwdRate),
      fwdpts2: coalesce(
        fwdPts,
        // The legs[1] generally equals legs[0]
        legs[2] !== undefined ? legs[2].fwdPts : undefined
      ),
      fwdrate2: coalesce(
        fwdRate,
        // The legs[1] generally equals legs[0]
        legs[2] !== undefined ? legs[2].fwdRate : undefined
      ),
      spot: legs[0].spot,
      usi: deal.usi,
      ...{ dealOutput: legs[0] },
    } as SummaryLeg);
  } else {
    moStore.setLegs(legs, null);
  }
};

export default (cuts: ReadonlyArray<Cut>, entry: DealEntry) => {
  const { deal } = moStore;
  useEffect(() => {
    if (deal === null) return;
    const task: Task<any> = API.getLegs(deal.dealID);
    task
      .execute()
      .then((response: any) => {
        if (response !== null) {
          if ("dealId" in response) {
            const legs: ReadonlyArray<Leg> = fixDates(response.legs);
            // Handle legs and populate from response
            handleLegsResponse(deal, legs, cuts);
          } else {
            // If there's an error, we must show it
            if ("error_msg" in response) {
              moStore.setError({
                status: "Server error",
                error: "Unexpected Error",
                content: response.error_msg,
                code: 500,
              });
            }
          }
        }
      })
      .catch((reason: any) => {
        if (reason === "aborted") {
          return;
        }
      });
    const removePricingListener: () => void = signalRManager.addPricingResponseListener(
      () => {
        if (moStore.status === MOStatus.Pricing) {
          moStore.setStatus(MOStatus.Normal);
        }
      }
    );
    return () => {
      removePricingListener();
      task.cancel();
    };
  }, [deal, cuts]);

  const { ccypair, strategy } = entry;
  useEffect(() => {
    // Reset
    moStore.setLegs([], null);
    // Then ... do our thing
    if (ccypair === "" || strategy === "") return;
    const symbol: Symbol | undefined = moStore.findSymbolById(ccypair);
    if (symbol === undefined) {
      throw new Error("could not find symbol: " + ccypair);
    }
    const legs: ReadonlyArray<Leg> | null = createStubLegs(
      strategy,
      cuts,
      symbol
    );
    if (legs !== null) {
      moStore.setLegs(legs, null);
    }
  }, [cuts, ccypair, strategy]);
};
