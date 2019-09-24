import {TileRenderer} from "./TileRenderer";
import {ReactElement} from "react";

export interface TileSiblings {
  next: ReactElement | null;
  prev: ReactElement | null;
}

export interface ITileProps {
  render: TileRenderer;
  title: string | null;
}
