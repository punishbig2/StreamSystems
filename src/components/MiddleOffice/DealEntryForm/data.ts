export interface VolSpreadRel {
  spread?: string;
  vol?: number;
}

export const volSpreadRelationships: { [key: string]: VolSpreadRel } = {
  BinaryBarier: {
    spread: undefined,
    vol: 13,
  },
  Butterfly: {
    spread: '25D',
    vol: undefined,
  },
  CalendarCallSpread: {
    spread: '25D',
    vol: undefined,
  },
  CalendarPutSpread: {
    spread: '25D',
    vol: undefined,
  },
  CallSpread: {
    spread: '25D',
    vol: undefined,
  },
  DoubleBarrier: {
    spread: undefined,
    vol: 13,
  },
  MultiLeg: {
    spread: undefined,
    vol: 13,
  },
  PutSpread: {
    spread: '25D',
    vol: undefined,
  },
  RiskReversal: {
    spread: '25D',
    vol: undefined,
  },
  SingleBarrier: {
    spread: undefined,
    vol: 13,
  },
  Straddle: {
    spread: '25D',
    vol: undefined,
  },
  Strangle: {
    spread: '25D',
    vol: undefined,
  },
  Vanilla: {
    spread: undefined,
    vol: 13,
  },
};
