import styled from 'styled-components';

export const ColumnLayout = styled.div`
  display: inline-block;
  border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
  border-top: 1px solid transparent;
  vertical-align: middle;
  box-sizing: border-box;
  text-align: center;
  text-transform: uppercase;
  width: ${(props: { width: number }) => props.width}%;
  line-height: ${({theme}) => theme.tableHeaderHeight}px;
  height: ${({theme}) => theme.tableHeaderHeight}px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight + 100};
  div {
    display: inline-block;
    vertical-align: middle;
    div {
      display: initial;
    }
  }
`;
