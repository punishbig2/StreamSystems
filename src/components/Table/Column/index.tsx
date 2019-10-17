import styled from 'styled-components';

export const Column = styled.div`
  display: inline-block;
  border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
  &:not(:last-child) {
    border-right: 1px solid ${({theme}) => theme.tableBorderColor};
  }
  vertical-align: middle;
  box-sizing: border-box;
  text-align: center;
  text-transform: uppercase;
  width: ${(props: {width: number}) => props.width}%;
  line-height: ${({theme}) => theme.tableRowSize}px;
  height: ${({theme}) => theme.tableRowSize}px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight + 100};
`;
