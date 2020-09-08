import { API, Task } from "API";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { LegOptionsDefIn } from "components/MiddleOffice/interfaces/legOptionsDef";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { createLegsFromDefinition, fixDates } from "legsUtils";
import moStore, { MOStatus } from "mobx/stores/moStore";
import moment from "moment";
import { useEffect } from "react";
import signalRManager from "signalR/signalRManager";
import { DealEntry } from "structures/dealEntry";
import { Symbol } from "types/symbol";
import { coalesce } from "utils";

const createStubLegs = async (
  entry: DealEntry,
  cuts: ReadonlyArray<Cut>
): Promise<void> => {
  if (entry.strategy === "") return;
  const symbol: Symbol | undefined = moStore.findSymbolById(entry.ccypair);
  if (symbol === undefined)
    throw new Error("could not find symbol: " + entry.ccypair);
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

const handleLegsResponse = (legs: Leg[]): void => {
  const { summaryLeg, deal } = moStore;
  if (legs[0].option === "SumLeg" || legs.length === 1) {
    const fwdPts: number | null =
      summaryLeg !== null ? summaryLeg.fwdpts1 : null;
    const fwdRate: number | null =
      summaryLeg !== null ? summaryLeg.fwdrate1 : null;
    moStore.setLegs(legs.slice(legs.length === 1 ? 0 : 1), {
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
      usi: deal !== null ? deal.usi : null,
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
    if (entry.ccypair === "") return;
    if (entry.dealId === "") {
      createStubLegs(entry, cuts).then(() => {});
      return;
    }
    const task: Task<any> = API.getLegs(entry.dealId);
    task
      .execute()
      .then((response: any) => {
        if (response !== null) {
          if ("dealId" in response) {
            handleLegsResponse(fixDates(response.legs));
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
            createStubLegs(entry, cuts).then(() => {});
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
