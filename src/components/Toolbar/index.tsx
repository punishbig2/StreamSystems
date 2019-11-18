import styled from 'styled-components';

export const Toolbar = styled.div`
  position: absolute;
  background-color: white;
  top: 0;
  right: 0;
  left: 0;
  height: ${({theme}) => theme.headerSize}px;
  line-height: ${({theme}) => theme.headerSize}px;
  border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
  padding: 0 16px;
  * {
    line-height: normal;
  }
`;
