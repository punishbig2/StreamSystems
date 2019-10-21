import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Types} from 'models/mdEntry';

export interface PriceProps {
  value: number;
  mine: boolean;
  dob?: { price: number, size: number }[];
  type?: Types;
  priceType?: PriceTypes;
}
