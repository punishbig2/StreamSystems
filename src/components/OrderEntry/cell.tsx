import styled from 'styled-components';

type TextAlign = 'center' | 'left' | 'right';

interface Props {
  width?: number;
  align?: TextAlign;
}

export const Cell = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: ${({width}: Props): number => width ? width : 50}%;
  text-align: ${({align}: Props): string => align ? align : 'initial'};
  line-height: ${({theme}) => theme.orderTicketRowHeight}px;
  height: ${({theme}) => theme.orderTicketRowHeight}px;
  box-sizing: border-box;
  font-size: ${({theme}) => theme.mediumFontSize}px;
  &:not(:only-child):last-child {
    border-left: 1px solid ${({theme}) => theme.tableBorderColor};
    text-align: center;
  }
  input {
    display: block;
    box-sizing: border-box;
    width: 100%;
    line-height: inherit;
    border: none;
    outline: 2px solid ${({theme}) => theme.tableBorderColor};
    outline-offset: 0;
    &:focus {
      outline-color: ${({theme}) => theme.primaryColor};
    }
    height: ${({theme}) => theme.orderTicketRowHeight}px;
    font-size: inherit;
    text-align: center;
  }
  span, input {
    padding: 0 8px;
    &.title {
      font-weight: 600;
      color: ${({theme}) => theme.tableCellDarkGray};
    }
  }
`;
