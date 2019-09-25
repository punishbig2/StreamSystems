import {ITileProps} from 'components/Tiles/ITileProps';
import {Geometry} from 'components/Tiles/Tile/geometry';
import {TileRenderer} from 'components/Tiles/tileRenderer';

export class Props implements ITileProps {
  public geometry: Geometry;
  public title: string | null = '';
  public isDocked: boolean = true;
  public id: string;
  public isDraggingOneTile: boolean = false;

  constructor(key: string) {
    // const {props} = tile;
    // this.render = props.render;
    // this.title = props.title;
    this.geometry = new Geometry(0, 0, 0, 0);
    this.isDocked = true;
    this.id = key;
  }

  public render: TileRenderer = () => null;

  public setTileDocked: (id: string, dock: boolean) => void = () => null;

  public onRelease: (key: string) => void = () => null;

  public onMakingRoom: (key: string | null) => void = () => null;

  public onGrab: (key: string) => void = () => null;
}
