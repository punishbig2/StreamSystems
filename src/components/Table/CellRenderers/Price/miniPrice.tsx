import styled from 'styled-components';

export const MiniPrice = styled.div`
  padding: 0 4px;
  &:first-child {
    border-left: 1px solid ${({theme}) => theme.tableBorderColor};
  }
  border-right: 1px solid ${({theme}) => theme.tableBorderColor};
  min-width: 60px;
  text-align: center;
`;
