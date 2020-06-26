import moment from "moment";

export interface OptionLeg {
  strike?: string;
  notional: number;
  expiryDate: moment.Moment;
  deliveryDate: moment.Moment;
  spreadVolatiltyOffset?: number | null;
  volatilty: number | null;
  barrier: number | null;
  barrierLower: number | null;
  barrierUpper: number | null;
  barrierRebate: number | null;
  OptionLegType: string;
  SideType: string;
  MonitorType: string | null;
}

export interface Option {
  ccyPair: string;
  ccy1: string;
  ccy2: string;
  notionalCCY: string;
  premiumCCY: string;
  riskCCY: string;
  vegaAdjust?: boolean;
  OptionProductType: string;
  OptionLegs: OptionLeg[];
}

export interface Point {
  date: string;
  point: number;
}

export interface FX {
  ccyPair: string;
  snapTime: Date;
  spotDate?: Date;
  spotRate?: number;
  DateCountBasisType: string;
  ForwardRates?: Point[];
}

export interface VolSurface {
  date: string;
  v10dRR: number;
  v25dRR: number;
  v25dBFLY: number;
  v10dBFLY: number;
  ATMType: string;
  DeltaType: string;
  vATM: number;
}

export interface VOL {
  ccyPair: string;
  snapTime: Date;
  premiumAdjustDelta: boolean;
  DateCountBasisType: string;
  VolSurface: VolSurface[];
}

export interface RATE {
  ccy: string;
  snapTime: Date;
  DateCountBasisType: string;
  DiscountFactors: Point[];
}

export interface ValuationData {
  valuationDate: Date;
  FX: FX;
  VOL: VOL;
  RATES: RATE[];
}

export interface ValuationModel {
  OptionModelType: string;
  OptionModelParamaters?: string;
}

export interface VolMessageIn {
  id: string;
  timeStamp: Date;
  version: string;
  description: string;
  Option: Option;
  ValuationData: ValuationData;
  ValuationModel: ValuationModel;
}

