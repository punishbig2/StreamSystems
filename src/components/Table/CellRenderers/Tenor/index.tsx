import React from 'react';

interface TenorProps {
  tenor: string;
  onTenorSelected: (tenor: string) => void;
}

export const Tenor: React.FC<TenorProps> = (props: TenorProps) => {
  return (
    <div className={'tenor-layout'} onDoubleClickCapture={() => props.onTenorSelected(props.tenor)}>{props.tenor}</div>
  );
};
