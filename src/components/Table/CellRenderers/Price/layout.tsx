import styled from 'styled-components';

export const PriceLayout = styled.div`
  input {
    display: block;
    padding: 0 8px;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;
    text-align: right;
    line-height: ${({theme}) => theme.tableRowSize}px;
    height: ${({theme}) => theme.tableRowSize}px;
    border: none;
    background: none;
    font-size: ${({theme}) => theme.tableFontSize}px;
    font-family: ${({theme}) => theme.tableFontFamily};
    font-weight: ${({theme}) => theme.tableFontWeight};
    &:not(:read-only) {
      color: crimson;
    }
    &.dark-pool {
      color: #a0a0a0;
    }
    &:focus {
      cursor: initial;
    }
    cursor: default;
  }
`;
