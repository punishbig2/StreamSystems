import { PodRow } from "types/podRow";

export type PodTable<T = PodRow> = { [tenor: string]: T };
