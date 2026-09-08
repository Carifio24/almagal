/* eslint-disable @typescript-eslint/naming-convention */

import "@wwtelescope/engine"; // all types are available to typescript here, but i import them specifically below for clarity


declare module "@wwtelescope/engine" {
  interface Table {
    rows: string[][];
    header: string[];
  }


  // merges with existing SpreadSheetLayer type
  interface SpreadSheetLayer {
    get__table(): Table;
    set__table(table: Table): Table;
    dirty: boolean;
  }

  namespace Coordinates {
    /** Returns [ra, dec] */
    function galactictoJ2000(l: number, b: number): [number, number];
    /** returns [GLON2, GLAT2] */
    function j2000toGalactic(ra: number, dec: number): [number, number]; // l is on RA, and b is on dec
  }

  class PointList {
    draw(renderContext: RenderContext, opacity: number, cull: boolean, depthMash=false);
  }
}
