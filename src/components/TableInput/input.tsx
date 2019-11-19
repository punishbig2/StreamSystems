import styled from 'styled-components';

export const Input = styled.input`
  padding: 0 8px;
  min-width: 0;
  width: 100%;
  text-align: center;
  line-height: ${({theme}) => theme.tableRowSize}px;
  height: ${({theme}) => theme.tableRowSize}px;
  border: none;
  background: none;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight};
  &:focus {
    outline: 2px solid ${({theme}) => theme.primaryColor};
    outline-offset: -2px;
    z-index: 1;
  }
  &:focus {
    cursor: initial;
  }
  cursor: default;
`;
