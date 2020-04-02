import React from 'react';

interface OwnProps {
  side: 'left' | 'right';
}

const Chevron: React.FC<OwnProps> = (props: OwnProps) => {
  return (
    <div className={`chevron ${props.side}`}>
      <i className={'fa fa-chevron-up'}/>
    </div>
  );
};

export { Chevron };
