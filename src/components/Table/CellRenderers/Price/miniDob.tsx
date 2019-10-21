import {DOBContent} from 'components/Table/CellRenderers/Price/dobContent';
import {DOBTitle} from 'components/Table/CellRenderers/Price/dobTitle';
import {MiniDOBRow} from 'components/Table/CellRenderers/Price/miniDOBRow';
import {MiniPrice} from 'components/Table/CellRenderers/Price/miniPrice';
import {PriceProps} from 'components/Table/CellRenderers/Price/props';
import {Size} from 'components/Table/CellRenderers/Size';
import {Types} from 'models/mdEntry';
import React, {ReactNode} from 'react';

export const MiniDOB: React.FC<PriceProps> = (props: PriceProps) => {
  const {dob} = props;
  if (!dob)
    return null;
  const children = dob.map(({price, size}: { price: number, size: number }) => {
    const elements: ReactNode[] = [<MiniPrice key={1}>{price.toFixed(2)}</MiniPrice>];
    const sizeElement = (
      <MiniPrice key={2}>
        <Size value={size} mine={false} type={props.type as Types}/>
      </MiniPrice>
    );
    if (props.type === Types.Bid)
      elements.unshift(sizeElement);
    else
      elements.push(sizeElement);
    return (
      <MiniDOBRow key={price}>
        {elements}
      </MiniDOBRow>
    );
  });
  return (
    <React.Fragment>
      <DOBTitle>{props.type === Types.Ask ? 'Ofr Mini DOB' : 'Bid Mini DOB'}</DOBTitle>
      <DOBContent>
        {children}
      </DOBContent>
    </React.Fragment>
  );
};
