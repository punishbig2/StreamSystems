import React from 'react';
import TilesManager from '../tilesManager';
import styled from 'styled-components';

const Layout = styled.div`
  position: relative;
`;

class Grid extends React.Component {
  private readonly container: React.RefObject<HTMLElement>;
  private readonly manager: TilesManager;

  public constructor() {
    super(React.Component);

    this.container = React.createRef();
    this.manager = new TilesManager(this.container);
  }

  public render(): React.ReactNode {
    return (
      <Layout ref={this.container}>
        Hello!
      </Layout>
    );
  }
}

export default Grid;
