import React, {useCallback} from 'react';
import Scrollbars from 'react-custom-scrollbars';

export const CustomScrollbars = ({onScroll, forwardedRef, style, children}: any) => {
  const customStyle = {...style, overflow: 'hidden'};
  const refSetter = useCallback(scrollbarsRef => {
    if (scrollbarsRef) {
      forwardedRef(scrollbarsRef.view);
    } else {
      forwardedRef(null);
    }
  }, [forwardedRef]);
  return (
    <Scrollbars ref={refSetter} style={customStyle} onScroll={onScroll} className={'tbody'}>
      {children}
    </Scrollbars>
  );
};
