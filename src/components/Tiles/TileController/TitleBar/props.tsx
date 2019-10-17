import React, {ReactElement} from 'react';

export interface TBProps {
  onGrab: (event: React.MouseEvent) => void;
  title: (props: any) => ReactElement | null;
  onToggleDocking: () => void;
  onMinimize: () => void;
  isDocked: boolean;
}
