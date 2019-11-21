import {useEffect} from 'react';

export const useTooltip = (started: boolean, activated: () => void) => {
  useEffect(() => {
    if (!started)
      return;
    const timer = setTimeout(activated, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [activated, started]);
};
