import {DOBContent} from 'components/Table/CellRenderers/Price/dobContent';
import {MiniDOBRow} from 'components/Table/CellRenderers/Price/miniDOBRow';
import {MiniPrice} from 'components/Table/CellRenderers/Price/miniPrice';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order} from 'interfaces/order';
import React, {ReactNode} from 'react';

interface Props {
  type?: EntryTypes;
  rows?: Order[];
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const {rows} = props;
  if (!rows)
    return null;
  const children = rows.map(({price, quantity}: Order, index: number) => {
    const elements: ReactNode[] = [<MiniPrice key={1}>{Number(price).toFixed(3)}</MiniPrice>];
    const sizeElement = (
      <MiniPrice key={2}>
        <Quantity value={quantity} type={props.type as EntryTypes} onChange={() => null}/>
      </MiniPrice>
    );
    if (props.type === EntryTypes.Bid)
      elements.unshift(sizeElement);
    else
      elements.push(sizeElement);
    return (
      <MiniDOBRow key={index}>
        {elements}
      </MiniDOBRow>
    );
  });
  return (
    <React.Fragment>
      <DOBContent>
        {children}
      </DOBContent>
    </React.Fragment>
  );
};
