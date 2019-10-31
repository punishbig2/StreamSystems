import {DOBContent} from 'components/Table/CellRenderers/Price/dobContent';
import {DOBTitle} from 'components/Table/CellRenderers/Price/dobTitle';
import {MiniDOBRow} from 'components/Table/CellRenderers/Price/miniDOBRow';
import {MiniPrice} from 'components/Table/CellRenderers/Price/miniPrice';
import {Size} from 'components/Table/CellRenderers/Size';
import {EntryTypes} from 'interfaces/mdEntry';
import React, {ReactNode} from 'react';

interface Props {
  type?: EntryTypes;
  dob: { price: string, size: string }[];
}

export const MiniDOB: React.FC<Props> = (props: Props) => {
  const {dob} = props;
  if (!dob)
    return null;
  const children = dob.map(({price, size}: { price: string, size: string }) => {
    const elements: ReactNode[] = [<MiniPrice key={1}>{price}</MiniPrice>];
    const sizeElement = (
      <MiniPrice key={2}>
        <Size value={size} mine={false} type={props.type as EntryTypes}/>
      </MiniPrice>
    );
    if (props.type === EntryTypes.Bid)
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
      <DOBTitle>{props.type === EntryTypes.Ask ? 'Ofr Mini DOB' : 'Bid Mini DOB'}</DOBTitle>
      <DOBContent>
        {children}
      </DOBContent>
    </React.Fragment>
  );
};
