import {ITile} from 'interfaces/tile';
import {TileTypes} from 'redux/constants/workareaConstants';
import shortid from 'shortid';

export class Tile implements ITile {
  public id: string;
  public type: TileTypes;
  public product: string;
  public symbol: string;

  constructor(type: TileTypes) {
    this.id = `tile-${shortid()}-${type}`;
    this.type = type;
    this.product = '';
    this.symbol = '';
  }
}
