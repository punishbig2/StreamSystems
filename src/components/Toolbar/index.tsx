import styled from 'styled-components';

export const Toolbar = styled.div`
  position: absolute;
  top: 0;
  left: 8px;
  right: 8px;
  line-height: ${({theme}) => theme.headerSize}px;
  height: ${({theme}) => theme.headerSize}px;
  padding: 0 16px;
  * {
    line-height: normal;
  }
`;
