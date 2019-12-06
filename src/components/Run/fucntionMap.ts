export const functionMap: { [key: string]: (a: number, b: number) => number } = {
  // Bid and Ofr
  obs: (o: number, b: number): number => o - b,
  obm: (o: number, b: number): number => (b + o) / 2,
  bos: (b: number, o: number): number => o - b,
  bom: (b: number, o: number): number => (b + o) / 2,

  // Ofr and Mid
  oms: (o: number, m: number): number => 2 * (o - m),
  omb: (o: number, m: number): number => 2 * m - o,
  mos: (m: number, o: number): number => 2 * (o - m),
  mob: (m: number, o: number): number => 2 * m - o,

  // Bid and Mid
  bms: (b: number, m: number): number => 2 * (m - b),
  bmo: (b: number, m: number): number => 2 * m - b,
  mbs: (m: number, b: number): number => 2 * (m - b),
  mbo: (m: number, b: number): number => 2 * m - b,

  // Ofr and Spread
  osm: (o: number, s: number): number => o - s / 2,
  osb: (o: number, s: number): number => o - s,
  som: (s: number, o: number): number => o - s / 2,
  sob: (s: number, o: number): number => o - s,

  // Bid and Spread
  bsm: (b: number, s: number): number => b + s / 2,
  bso: (b: number, s: number): number => b + s,
  sbm: (s: number, b: number): number => b + s / 2,
  sbo: (s: number, b: number): number => b + s,

  // Mid and Spread
  mso: (m: number, s: number): number => m + s / 2,
  msb: (m: number, s: number): number => m - s / 2,
  smo: (s: number, m: number): number => m + s / 2,
  smb: (s: number, m: number): number => m - s / 2,
};
