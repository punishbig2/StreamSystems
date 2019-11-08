import styled from 'styled-components';

export const Layout = styled.div`
  width: ${(props: { width: number }) => props.width}%;
  padding: 0;
  margin: 0;
  &:not(:last-child) {
    border-right: 1px solid ${({theme}) => theme.tableBorderColor};
  }
  display: inline-block;
  vertical-align: middle;
  box-sizing: border-box;
  line-height: ${({theme}) => theme.tableRowSize}px;
  height: ${({theme}) => theme.tableRowSize}px;
  font-size: ${({theme}) => theme.tableFontSize}px;
  font-family: ${({theme}) => theme.tableFontFamily};
  font-weight: ${({theme}) => theme.tableFontWeight};
`;
