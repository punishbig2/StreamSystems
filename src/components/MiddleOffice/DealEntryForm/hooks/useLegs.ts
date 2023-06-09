import { toNumberOrFallbackIfNaN } from 'columns/podColumns/OrderColumn/helpers/toNumberOrFallbackIfNaN';
import { isInvalidTenor } from 'components/FormField/helpers';
import { Cut } from 'components/MiddleOffice/types/cut';
import { Leg } from 'components/MiddleOffice/types/leg';
import { LegOptionsDefIn, LegOptionsDefOut } from 'components/MiddleOffice/types/legOptionsDef';
import { SummaryLeg, SummaryLegBase } from 'components/MiddleOffice/types/summaryLeg';
import { DealEntry } from 'types/dealEntry';
import { FXSymbol, InvalidSymbol } from 'types/FXSymbol';
import { InvalidStrategy, Product } from 'types/product';
import { Sides } from 'types/sides';
import { InvalidTenor, Tenor } from 'types/tenor';
import { coalesce } from 'utils/commonUtils';
import {
  calculateNetValue,
  convertLegNumbers,
  createLegsFromDefinitionAndDeal,
} from 'utils/legsUtils';

const fwdRatesFromExtraFields = (
  extraFields: { [key: string]: number | string | Date | null } | undefined
): Pick<SummaryLeg, 'fwdpts1' | 'fwdpts2' | 'fwdrate1' | 'fwdrate2' | 'spot'> => {
  return {
    fwdpts1: extraFields && typeof extraFields.fwdpts1 === 'number' ? extraFields.fwdpts1 : null,
    fwdrate1: extraFields && typeof extraFields.fwdrate1 === 'number' ? extraFields.fwdrate1 : null,
    fwdpts2: extraFields && typeof extraFields.fwdpts2 === 'number' ? extraFields.fwdpts2 : null,
    fwdrate2: extraFields && typeof extraFields.fwdrate2 === 'number' ? extraFields.fwdrate2 : null,
    spot: !!extraFields && typeof extraFields.spot === 'number' ? extraFields.spot : null,
  };
};

const createEmptySummaryLegFromCuts = (
  cuts: readonly Cut[],
  strategy: Product,
  symbol: FXSymbol,
  tradeDate: Date,
  premiumDate: Date | null,
  deliveryDate: Date | undefined,
  expiryDate: Date
): SummaryLegBase | null => {
  const cut: Cut | undefined = cuts.find((cut: Cut) => {
    return cut.Code === symbol.PrimaryCutCode && cut.UTCTime === symbol.PrimaryUTCTime;
  });

  if (cut !== undefined) {
    return {
      fwdpts1: null,
      fwdpts2: null,
      fwdrate1: null,
      fwdrate2: null,
      spot: null,
      cutCity: cut.City,
      cutTime: cut.LocalTime,
      dealOutput: {
        premiumDate: premiumDate,
        deliveryDate: deliveryDate !== undefined ? deliveryDate : new Date(),
        expiryDate: expiryDate,
        side: Sides.None,
        option: '',
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
        premiumCurrency: 'USD',
        usi_num: null,
        rates: [
          {
            currency: '',
            value: 0,
          },
          {
            currency: '',
            value: 0,
          },
        ],
      },
      delivery: symbol.SettlementType,
      source: symbol.FixingSource,
      tradeDate: tradeDate,
      usi: null,
      strategy: strategy.description,
    };
  } else {
    return null;
  }
};

export const addFwdRates = (legs: readonly Leg[], summary: SummaryLeg | null): readonly Leg[] => {
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
  legs: readonly Leg[],
  cuts: readonly Cut[],
  origSummaryLeg: SummaryLeg | null,
  legDefinitions: { out: readonly LegOptionsDefOut[] }
): [readonly Leg[], SummaryLeg | null] => {
  if (legs.length === 0) return [[], null];
  const { extra_fields = {} } = entry;
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return [[], null];
  const fwdPts1: number | null = coalesce(
    extra_fields.fwdpts1,
    origSummaryLeg !== null ? origSummaryLeg.fwdpts1 : null
  );
  const fwdRate1: number | null = coalesce(
    extra_fields.fwdrate1,
    origSummaryLeg !== null ? origSummaryLeg.fwdrate1 : null
  );
  const fwdPts2: number | null = coalesce(
    extra_fields.fwdpts2,
    origSummaryLeg !== null ? origSummaryLeg.fwdpts2 : null
  );
  const fwdRate2: number | null = coalesce(
    extra_fields.fwdrate2,
    origSummaryLeg !== null ? origSummaryLeg.fwdrate2 : null
  );

  if (legs[0]?.option !== 'SumLeg') {
    throw new Error('bad summary leg at index');
  }
  const sliceIndex = 1;
  const finalLegs: readonly Leg[] = legs.slice(sliceIndex).map(convertLegNumbers);
  const savedSummaryLeg = legs[0];
  const leg1 = legs[sliceIndex];
  const leg2 = legs[sliceIndex + 1];

  const baseSummaryLeg = createEmptySummaryLegFromCuts(
    cuts,
    entry.strategy,
    entry.symbol,
    entry.tradeDate,
    entry.premiumDate,
    tenor.deliveryDate,
    tenor.expiryDate
  );
  if (baseSummaryLeg === null) {
    throw new Error('cuts unknown at this stage, this should never happen');
  }

  const finalSummaryLeg: SummaryLeg = new SummaryLeg(
    {
      ...baseSummaryLeg,
      ...origSummaryLeg,
      ...savedSummaryLeg,
      fwdpts1: toNumberOrFallbackIfNaN(coalesce(fwdPts1, leg1.fwdPts), null),
      fwdrate1: toNumberOrFallbackIfNaN(coalesce(fwdRate1, leg1.fwdRate), null),
      fwdpts2: toNumberOrFallbackIfNaN(
        coalesce(
          fwdPts2,
          // The legs[1] generally equals legs[0]
          leg2?.fwdPts ?? undefined
        ),
        null
      ),
      fwdrate2: toNumberOrFallbackIfNaN(
        coalesce(
          fwdRate2,
          // The legs[1] generally equals legs[0]
          leg2 !== undefined ? leg2.fwdRate : undefined
        ),
        null
      ),
      spot: toNumberOrFallbackIfNaN(coalesce(extra_fields.spot, leg1.spot), null),
      usi: entry.usi ?? null,
      dealOutput: {
        ...leg1,
        gamma: null,
        vega: null,
        hedge: calculateNetValue(entry.strategy, finalLegs, 'hedge', legDefinitions),
        premium: calculateNetValue(entry.strategy, finalLegs, 'premium', legDefinitions),
        price: calculateNetValue(entry.strategy, finalLegs, 'price', legDefinitions),
      },
    },
    savedSummaryLeg.spotDate ?? null
  );

  return [addFwdRates(finalLegs, finalSummaryLeg), finalSummaryLeg];
};

export const createDefaultLegsFromDeal = (
  cuts: readonly Cut[],
  entry: DealEntry,
  legDefinitions: { in: readonly LegOptionsDefIn[] },
  idealSpotDate: Date | null
): [readonly Leg[], SummaryLeg | null] => {
  const { strategy, symbol } = entry;
  if (
    strategy === InvalidStrategy ||
    strategy.productid === '' ||
    symbol === InvalidSymbol ||
    symbol.symbolID === ''
  ) {
    return [[], null];
  }
  if (legDefinitions === undefined) {
    console.warn('leg definitions missing');
    return [[], null];
  }
  const legs: readonly Leg[] = createLegsFromDefinitionAndDeal(legDefinitions.in, entry);
  const tenor: Tenor | InvalidTenor = entry.tenor1;
  if (isInvalidTenor(tenor)) return [[], null];
  const baseSummaryLeg = createEmptySummaryLegFromCuts(
    cuts,
    entry.strategy,
    entry.symbol,
    entry.tradeDate,
    entry.premiumDate,
    tenor.deliveryDate,
    tenor.expiryDate
  );
  if (baseSummaryLeg === null) {
    throw new Error('cuts unknown at this stage, this should never happen');
  }

  const summaryLeg: SummaryLeg = new SummaryLeg(
    {
      ...baseSummaryLeg,
      ...fwdRatesFromExtraFields(entry.extra_fields),
    },
    idealSpotDate
  );

  return [addFwdRates(legs, summaryLeg), summaryLeg];
};
