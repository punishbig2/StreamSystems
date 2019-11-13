import styled from 'styled-components';

export const SizeLayout = styled.div`
  display: flex;
  align-items: center;
  line-height: ${({theme}) => theme.tableRowSize}px;
  white-space: nowrap;
  div {
    display: flex;
    align-items: center;
    text-align: center;
    color: ${({theme}) => theme.textColorBlue};
    width: ${({theme}) => theme.tableRowSize}px;
    line-height: ${({theme}) => theme.tableRowSize}px;
    height: ${({theme}) => theme.tableRowSize}px; 
    &.times {
      top: 0;
      left: 0;
      color: ${({theme}) => theme.tableCellRed};
      height: ${({theme}) => theme.tableRowSize}px;
      width: ${({theme}) => theme.tableRowSize}px;
      line-height: ${({theme}) => theme.tableRowSize}px;
      &:not(.clickable) {
        color: transparent;
      }
      &.clickable:hover {
        &::after {
          background-color: ${({theme}) => theme.tableCellRed};
          color: white;
        }
        cursor: default;
      }
      &.clickable:active {
        transform: translateY(1px);
      }
      &::after {
        text-align: center;
        font-size: 20px;
        content: '\u00D7';
        border-radius: 8px;
        line-height: 16px;
        width: 16px;
        height: 16px;
        margin: auto;
      }
    }
  }
  input {
    flex: 1;
    text-overflow: ellipsis;
    overflow: hidden;
    text-align: center;
  }
`;
