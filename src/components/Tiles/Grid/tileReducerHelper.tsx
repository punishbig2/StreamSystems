// to a more suitable form
import {ReactNode} from 'react';

export interface ReducerHelper {
  items: ReactNode[];
  // Use memoization to prevent counting floating items
  floatingCount: number;
}
