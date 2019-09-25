import React from 'react';

export interface TBProps {
  onGrab: (event: React.MouseEvent) => void;
  title: string | null;
  onToggleDocking: () => void;
  onMinimize: () => void;
  isDocked: boolean;
}
