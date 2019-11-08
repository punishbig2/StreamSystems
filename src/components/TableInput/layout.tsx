import styled from 'styled-components';

export const Layout = styled.input`
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
    outline-offset: 0;
    z-index: 1;
  }
  &.red {
    color: ${({theme}) => theme.textColorRed};
  }
  &.black {
    color: ${({theme}) => theme.textColorBlack};
  }
  &.gray {
    color: ${({theme}) => theme.textColorGray};
  }
  &.blue {
    color: ${({theme}) => theme.textColorBlue};
  }
  &.green {
    color: ${({theme}) => theme.textColorGreen};
  }
  &:focus {
    cursor: initial;
  }
  cursor: default;
`;
