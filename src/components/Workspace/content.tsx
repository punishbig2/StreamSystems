import styled from 'styled-components';

export const Content = styled.div`
  position: fixed;
  top: ${({theme}) => theme.headerSize}px;
  bottom: ${({theme}) => theme.footerSize}px;
  left: 0;
  right: 0;
`;
