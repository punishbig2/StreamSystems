import styled from 'styled-components';

export const StyledSelect = styled.select`
  pointer-events: initial;
  display: block;
  background: none;
  border: none;
  padding: 2px 12px;
  &:hover, &:focus {
    background-color: rgba(0, 0, 0, 0.15);
  }
`;
