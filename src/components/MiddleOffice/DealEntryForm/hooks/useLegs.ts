import { API, Task } from "API";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
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

const createStubLegs = async (
  entry: DealEntry,
  cuts: ReadonlyArray<Cut>,
  symbol: Symbol
): Promise<SummaryLeg | null> => {
  const legDefinitions: { in: LegOptionsDefIn[] } | undefined =
    moStore.legDefinitions[entry.strategy];
  if (!legDefinitions) {
    console.warn(`no leg definitions found for ${entry.strategy}`);
    console.warn("available strategies are: ", moStore.legDefinitions);
    return null;
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
      const expiryDate: moment.Moment | null = coalesce(
        index === 1 ? entry.tenor2expiry : entry.tenor1expiry,
        entry.tenor1expiry
      );
      const deliveryDate: moment.Moment | null =
        expiryDate !== null
          ? moment(expiryDate).add(Number(symbol.SettlementWindow), "d")
          : null;
      return {
        ...leg,
        notional: notional,
        strike: entry.dealstrike,
        expiryDate: expiryDate,
        deliveryDate: deliveryDate,
        vol: entry.vol,
      };
    }
  );
  // Update the moStore store
  moStore.setLegs(newLegs, null);
  // Update the stub summary leg
  if (entry.tenor1expiry !== null) {
    const tradeDate: moment.Moment = entry.tradeDate;
    return createSummaryLeg(
      cuts,
      entry.strategy,
      symbol,
      tradeDate,
      moment(tradeDate).add(symbol.SettlementWindow, "d"),
      entry.deliveryDate,
      entry.tenor1expiry
    );
  } else {
    return null;
  }
};

const handleLegsResponse = (
  legs: Leg[],
  cuts: ReadonlyArray<Cut>,
  symbol: Symbol
): void => {
  const { summaryLeg, deal } = moStore;
  // FIXME: probably should throw
  if (deal === null) return;
  if (legs[0].option === "SumLeg" || legs.length === 1) {
    const fwdPts: number | null =
      summaryLeg !== null ? summaryLeg.fwdpts1 : null;
    const fwdRate: number | null =
      summaryLeg !== null ? summaryLeg.fwdrate1 : null;
    moStore.setLegs(legs.slice(legs.length === 1 ? 0 : 1), {
      ...createSummaryLeg(
        cuts,
        deal.strategy,
        symbol,
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
  useEffect(() => {
    moStore.setLegs([], null);
  }, [entry.strategy]);
  useEffect(() => {
    if (entry.strategy === "") return;
    const symbol: Symbol | undefined = moStore.findSymbolById(entry.ccypair);
    if (symbol === undefined)
      throw new Error("could not find symbol: " + entry.ccypair);
    if (entry.ccypair === "") return;
    if (entry.dealId === "") {
      createStubLegs(entry, cuts, symbol).then(moStore.setSummaryLeg);
      return;
    }
    const task: Task<any> = API.getLegs(entry.dealId);
    task
      .execute()
      .then((response: any) => {
        if (response !== null) {
          if ("dealId" in response) {
            handleLegsResponse(fixDates(response.legs), cuts, symbol);
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
        } else {
          if (reason.code === 404) {
            // No legs were found, so we can generate them from here
            createStubLegs(entry, cuts, symbol).then(moStore.setSummaryLeg);
          }
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
  }, [cuts, entry]);
};
