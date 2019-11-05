import {TenorLayout} from 'components/Table/CellRenderers/Tenor/layout';
import React from 'react';

interface TenorProps {
  tenor: string;
  onTenorSelected: (tenor: string) => void;
}

export const Tenor: React.FC<TenorProps> = (props: TenorProps) => {
  return (
    <TenorLayout onDoubleClickCapture={() => props.onTenorSelected(props.tenor)}>{props.tenor}</TenorLayout>
  );
};
