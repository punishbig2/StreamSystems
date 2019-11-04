import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {TitleBar} from 'components/TileTitleBar';
import {StyledSelect} from 'components/TOBTile/styledSelect';
import {Product} from 'interfaces/product';
import React, {ReactElement} from 'react';

interface Props {
  symbols: string[];
  symbol: string,
  products: Product[];
  product: string;
  onClose: () => void;
  setSymbol: ({target: {value}}: { target: HTMLSelectElement }) => void;
  setProduct: ({target: {value}}: { target: HTMLSelectElement }) => void;
}

export const TOBTileTitle: React.FC<Props> = (props: Props): ReactElement => {
  const {symbols, symbol, products, product, setSymbol, setProduct} = props;
  return (
    <TitleBar>
      <StyledSelect value={symbol} onChange={setSymbol}>
        <option value={''} disabled>Choose one</option>
        {symbols.map((item: string) => <option value={item} key={item}>{item}</option>)}
      </StyledSelect>
      <StyledSelect value={product} onChange={setProduct}>
        <option value={''} disabled>Choose one</option>
        {products.map((item: Product) => <option value={item.name} key={item.name}>{item.name}</option>)}
      </StyledSelect>
      <DefaultWindowButtons onClose={props.onClose}/>
    </TitleBar>
  );
};
