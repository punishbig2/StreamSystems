import styled from 'styled-components';

export const Footer = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  line-height: ${({theme}) => theme.footerSize}px;
  height: ${({theme}) => theme.footerSize}px;
  bottom: 0;
  padding: 0 8px;
  left: 0;
  right: 0;
`;
