import styled from 'styled-components';

export const Layout = styled.input`
  padding: 0 8px;
  min-width: 0;
  width: 100%;
  text-align: ${({aligned}: { aligned?: 'center' | 'right' | 'left' }) => aligned ? aligned : 'right'};
  line-height: ${({theme}) => theme.tableRowSize}px;
  height: ${({theme}) => theme.tableRowSize}px;
  border: none;
  background: none;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight};
  &:focus {
    outline: 2px solid ${({theme}) => theme.primaryColor};
    outline-offset: 0;
    z-index: 1;
  }
  &:not(.black):not(:read-only) {
    color: crimson;
  }
  &.normal {
    color: black;
  }
  &.dark-pool {
    color: #a0a0a0;
  }
  &:focus {
    cursor: initial;
  }
  cursor: default;
`;
