export interface Computed {
  spread: number | null;
  mid: number | null;
  offer: number | null;
  bid: number | null;
  // Typescript is stupid
  [key: string]: any;
}
