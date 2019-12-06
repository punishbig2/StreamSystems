export interface RunEntry {
  spread: number | null;
  mid: number | null;
  ofr: number | null;
  bid: number | null;
  // Typescript is stupid
  [key: string]: any;
}
