import {DefaultWindowButtons} from 'components/DefaultWindowButtons';
import {Strategy} from 'interfaces/strategy';
import React, {ReactElement} from 'react';

interface Props {
  symbols: string[];
  symbol: string,
  products: Strategy[];
  strategy: string;
  setSymbol: ({target: {value}}: { target: HTMLSelectElement }) => void;
  setProduct: ({target: {value}}: { target: HTMLSelectElement }) => void;
}

export const TOBTileTitle: React.FC<Props> = (props: Props): ReactElement => {
  const {symbols, symbol, products, strategy, setSymbol, setProduct} = props;
  return (
    <div className={'window-title-bar'}>
      <select value={symbol || -1} onChange={setSymbol}>
        <option value={-1} disabled>Choose one</option>
        {symbols.map((item: string) => <option value={item} key={item}>{item}</option>)}
      </select>
      <select value={strategy || -1} onChange={setProduct}>
        <option value={-1} disabled>Choose one</option>
        {products.map((item: Strategy) => <option value={item.name} key={item.name}>{item.name}</option>)}
      </select>
      <DefaultWindowButtons onClose={() => null}/>
    </div>
  );
};
