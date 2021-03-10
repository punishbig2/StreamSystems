import { ModelParameters } from "mobx/stores/moStore";
import { LegAdjustValue } from "types/legAdjustValue";

export interface OptionLeg {
  readonly strike?: string | number | null;
  readonly notional: number;
  readonly expiryDate: string;
  readonly deliveryDate: string;
  readonly spreadVolatiltyOffset?: number | null;
  readonly volatilty?: number | null;
  readonly barrier: number | null;
  readonly barrierLower: number | null;
  readonly barrierUpper: number | null;
  readonly barrierRebate: number | null;
  readonly OptionLegType: string;
  readonly SideType: string;
  readonly MonitorType: string | null;
}

export interface Option {
  readonly ccyPair: string;
  readonly ccy1: string;
  readonly ccy2: string;
  readonly notionalCCY: string;
  readonly premiumCCY: string;
  readonly riskCCY: string;
  readonly ccyGroup: string;
  readonly vegaAdjust: string | null;
  readonly OptionProductType: string;
  readonly OptionLegs: OptionLeg[];
}

export interface Point {
  readonly date: string;
  readonly point: number;
}

export interface FX {
  readonly ccyPair: string;
  readonly snapTime: Date;
  readonly spotDate?: Date;
  readonly spotRate?: number;
  readonly DateCountBasisType: string;
  readonly ForwardRates?: Point[];
  readonly ForwardPoints?: Point[] | null;
  readonly strikeForwardMRoundingFactor?: number;
  readonly premiumMRoundingFactor?: number;
  readonly InterpolationMethod: "PIECEWISE_CONSTANT" | null;
}

export interface VolSurface {
  readonly date: string;
  readonly v10dRR: number;
  readonly v25dRR: number;
  readonly v25dBFLY: number;
  readonly v10dBFLY: number;
  readonly ATMType: string;
  readonly DeltaType: string;
  readonly vATM: number;
}

export interface VOL {
  readonly ccyPair: string;
  readonly snapTime: Date;
  readonly premiumAdjustDelta: boolean;
  readonly DateCountBasisType: string;
  readonly VolSurface: VolSurface[];
}

export interface RATE {
  readonly ccy: string;
  readonly snapTime: Date;
  readonly DateCountBasisType: string;
  readonly DiscountFactors: Point[];
}

export interface ValuationData {
  readonly valuationDate: string;
  readonly valuationDateUTC: string;
  readonly FX: FX;
  readonly VOL: VOL;
  readonly RATES: RATE[];
}

export interface ValuationModel {
  readonly OptionModelType: {};
  readonly OptionModelParamaters?: ModelParameters;
}

export interface VolMessageIn {
  readonly id: string;
  readonly timeStamp: string;
  readonly version: string;
  readonly description: string;
  readonly Option: Option;
  readonly ValuationData: ValuationData;
  readonly ValuationModel: ValuationModel;
  readonly spotDate: string;

  readonly Spot?: number | null | undefined;
}
