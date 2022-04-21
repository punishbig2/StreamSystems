import { toNumberOrFallbackIfNaN } from "columns/podColumns/OrderColumn/helpers/toNumberOrFallbackIfNaN";
import { isInvalidTenor } from "components/FormField/helpers";
import { Cut } from "components/MiddleOffice/types/cut";
import { Leg } from "components/MiddleOffice/types/leg";
import {
  LegOptionsDefIn,
  LegOptionsDefOut,
} from "components/MiddleOffice/types/legOptionsDef";
import { InvalidStrategy, Product } from "types/product";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { DealEntry } from "types/dealEntry";
import { Sides } from "types/sides";
import { InvalidSymbol, Symbol } from "types/symbol";
import { InvalidTenor, Tenor } from "types/tenor";
import { coalesce } from "utils/commonUtils";
import {
  calculateNetValue,
  convertLegNumbers,
  createLegsFromDefinitionAndDeal,
} from "utils/legsUtils";

const buildSummaryLegFromCut = (
  cut: Cut,
  strategy: Product,
  symbol: Symbol,
  tradeDate: Date,
  premiumDate: Date,
  spotDate: Date,
  deliveryDate: Date | undefined,
  expiryDate: Date,
  extraFields: { [key: string]: number | string | null } | undefined
): SummaryLeg => {
  return {
    fwdpts1:
      extraFields && typeof extraFields.fwdpts1 === "number"
        ? extraFields.fwdpts1
        : null,
    fwdrate1:
      extraFields && typeof extraFields.fwdrate1 === "number"
        ? extraFields.fwdrate1
        : null,
    fwdpts2:
      extraFields && typeof extraFields.fwdpts2 === "number"
        ? extraFields.fwdpts2
        : null,
    fwdrate2:
      extraFields && typeof extraFields.fwdrate2 === "number"
        ? extraFields.fwdrate2
        : null,
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
    spot:
      !!extraFields && typeof extraFields.spot === "number"
        ? extraFields.spot
        : null,
    spotDate: spotDate,
    tradeDate: tradeDate,
    usi: null,
    strategy: strategy.description,
  };
};

const createSummaryLeg = (
  cuts: ReadonlyArray<Cut>,
  strategy: Product,
  symbol: Symbol,
  tradeDate: Date,
  premiumDate: Date,
  spotDate: Date,
  deliveryDate: Date | undefined,
  expiryDate: Date,
  extraFields: { [key: string]: number | string | null } | undefined
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
      expiryDate,
      extraFields
    );
  } else {
    return null;
  }
};

export const addFwdRates = (
  legs: ReadonlyArray<Leg>,
  summary: SummaryLeg | null
): ReadonlyArray<Leg> => {
  if (summary === null) return legs;
  if (legs.length !== 2) {
    return legs.map((leg: Leg): Leg => {
      return {
        ...leg,
        fwdRate: coalesce(leg.fwdRate, summary.fwdrate1),
        fwdPts: coalesce(leg.fwdPts, summary.fwdpts1),
      };
    });
  } else {
    return [
      {
        ...legs[0],
        fwdRate: coalesce(legs[0].fwdRate, summary.fwdrate1),
        fwdPts: coalesce(legs[0].fwdPts, summary.fwdpts1),
      },
      {
        ...legs[1],
        fwdRate: coalesce(legs[1].fwdRate, summary.fwdrate2),
        fwdPts: coalesce(legs[1].fwdPts, summary.fwdpts2),
      },
    ];
  }
};

export const handleLegsResponse = (
  entry: DealEntry,
  legs: ReadonlyArray<Leg>,
  cuts: ReadonlyArray<Cut>,
  summaryLeg: SummaryLeg | null,
  legDefinitions: { out: ReadonlyArray<LegOptionsDefOut> }
): [ReadonlyArray<Leg>, SummaryLeg | null] => {
  if (legs.length === 0) return [[], null];
  const { extra_fields = {} } = entry;
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return [[], null];
  const fwdPts1: number | null = coalesce(
    extra_fields.fwdpts1,
    summaryLeg !== null ? summaryLeg.fwdpts1 : null
  );
  const fwdRate1: number | null = coalesce(
    extra_fields.fwdrate1,
    summaryLeg !== null ? summaryLeg.fwdrate1 : null
  );
  const fwdPts2: number | null = coalesce(
    extra_fields.fwdpts2,
    summaryLeg !== null ? summaryLeg.fwdpts2 : null
  );
  const fwdRate2: number | null = coalesce(
    extra_fields.fwdrate2,
    summaryLeg !== null ? summaryLeg.fwdrate2 : null
  );
  const sliceIndex: number = ((): number => {
    if (legs[0].option === "SumLeg" || legs.length === 1) {
      return legs.length === 1 ? 0 : 1;
    } else {
      return 0;
    }
  })();
  const finalLegs: ReadonlyArray<Leg> = legs
    .slice(sliceIndex)
    .map(convertLegNumbers);
  const firstLeg = legs[sliceIndex];
  const secondLeg = legs[sliceIndex + 1];
  const finalSummaryLeg: SummaryLeg = {
    ...createSummaryLeg(
      cuts,
      entry.strategy,
      entry.symbol,
      entry.tradeDate,
      entry.premiumDate,
      entry.spotDate,
      tenor.deliveryDate,
      tenor.expiryDate,
      entry.extra_fields
    ),
    ...summaryLeg,
    fwdpts1: toNumberOrFallbackIfNaN(coalesce(fwdPts1, firstLeg.fwdPts), null),
    fwdrate1: toNumberOrFallbackIfNaN(
      coalesce(fwdRate1, firstLeg.fwdRate),
      null
    ),
    fwdpts2: toNumberOrFallbackIfNaN(
      coalesce(
        fwdPts2,
        // The legs[1] generally equals legs[0]
        secondLeg?.fwdPts ?? undefined
      ),
      null
    ),
    fwdrate2: toNumberOrFallbackIfNaN(
      coalesce(
        fwdRate2,
        // The legs[1] generally equals legs[0]
        secondLeg !== undefined ? secondLeg.fwdRate : undefined
      ),
      null
    ),
    spot: toNumberOrFallbackIfNaN(
      coalesce(extra_fields.spot, firstLeg.spot),
      null
    ),
    usi: entry.usi,
    ...{
      dealOutput: {
        ...legs[0],
        hedge: calculateNetValue(
          entry.strategy,
          finalLegs,
          "hedge",
          legDefinitions
        ),
        premium: calculateNetValue(
          entry.strategy,
          finalLegs,
          "premium",
          legDefinitions
        ),
        price: calculateNetValue(
          entry.strategy,
          finalLegs,
          "price",
          legDefinitions
        ),
      },
    },
  } as SummaryLeg;
  return [addFwdRates(finalLegs, finalSummaryLeg), finalSummaryLeg];
};

export const createDefaultLegsFromDeal = (
  cuts: ReadonlyArray<Cut>,
  entry: DealEntry,
  legDefinitions: { in: ReadonlyArray<LegOptionsDefIn> }
): [ReadonlyArray<Leg>, SummaryLeg | null] => {
  const { strategy, symbol } = entry;
  if (
    strategy === InvalidStrategy ||
    strategy.productid === "" ||
    symbol === InvalidSymbol ||
    symbol.symbolID === ""
  ) {
    return [[], null];
  }
  if (legDefinitions === undefined) {
    console.warn("leg definitions missing");
    return [[], null];
  }
  const legs: ReadonlyArray<Leg> = createLegsFromDefinitionAndDeal(
    legDefinitions.in,
    entry
  );
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return [[], null];
  const summaryLeg: SummaryLeg | null = createSummaryLeg(
    cuts,
    entry.strategy,
    entry.symbol,
    entry.tradeDate,
    entry.premiumDate,
    entry.spotDate,
    tenor.deliveryDate,
    tenor.expiryDate,
    entry.extra_fields
  );
  return [addFwdRates(legs, summaryLeg), summaryLeg];
};
