import styled from 'styled-components';

export const Footer = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  background-color: white;
  border-top: 1px solid ${({theme}) => theme.tableBorderColor};
  line-height: ${({theme}) => theme.footerSize}px;
  left: 0;
  right: 0;
  bottom: 0;
  height: ${({theme}) => theme.footerSize}px;
  padding: 0 8px;
`;
