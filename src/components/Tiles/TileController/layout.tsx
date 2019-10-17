import styled from 'styled-components';

export const Layout = styled.div`
  position: absolute;
  &.floating {
    z-index: ${Number.MAX_SAFE_INTEGER};
    box-shadow: 0 2px 16px -4px rgba(0, 0, 0, 0.75);
    border-radius: 3px;
  }
  &.docked {
    transition: all 0.5s ease-in;
  }
  &.grabbed {
    pointer-events: none;
  }
`;