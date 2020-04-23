import React, { ReactElement, PropsWithChildren, useState } from 'react';

interface OwnProps {
  title: string;
}

type Props = PropsWithChildren<OwnProps>;

export const CollapsibleFormGroup: React.FC<Props> = (props: Props): ReactElement | null => {
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <div className={'form-group'}>
      <h1>{props.title}</h1>
      <div className={'expand-button' + (expanded ? ' expanded' : '')} onClick={() => setExpanded(!expanded)}/>
      {expanded && props.children}
    </div>
  );
};
