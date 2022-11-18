import { DealOutput } from 'types/dealOutput';

export interface SummaryLegBase {
  strategy: string;
  tradeDate: Date;
  spot: number | null;
  cutCity: string;
  cutTime: string;
  source: string | null;
  delivery: string;
  usi: string | null;
  dealOutput: DealOutput;
  fwdrate1: number | null;
  fwdpts1: number | null;
  fwdrate2: number | null;
  fwdpts2: number | null;
}

export class SummaryLeg implements SummaryLegBase {
  public cutCity: string;
  public cutTime: string;
  public dealOutput: DealOutput;
  public delivery: string;
  public fwdpts1: number | null;
  public fwdpts2: number | null;
  public fwdrate1: number | null = null;
  public fwdrate2: number | null = null;
  public source: string | null = null;
  public spot: number | null = null;
  public strategy = '';
  public tradeDate: Date = new Date();
  public usi: string | null = null;

  private readonly internalSpotDate: Date | null = null;

  constructor(base: SummaryLegBase | SummaryLeg, idealSpotDate: Date | null) {
    this.cutCity = base.cutCity;
    this.cutTime = base.cutTime;
    this.dealOutput = base.dealOutput;
    this.delivery = base.delivery;
    this.fwdpts1 = base.fwdpts1;
    this.fwdpts2 = base.fwdpts2;
    this.fwdrate1 = base.fwdrate1;
    this.fwdrate2 = base.fwdrate2;
    this.source = base.source;
    this.spot = base.spot;
    this.strategy = base.strategy;
    this.tradeDate = base.tradeDate;
    this.usi = base.usi;
    this.internalSpotDate = idealSpotDate;
  }

  public get spotDate(): Date | null {
    return this.internalSpotDate;
  }
}
