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
    /** Earth's obliquity at a given Julian date, in degrees. */
    function meanObliquityOfEcliptic(jd: number): number;
    /** The inverse of raDecTo3d: [ra in hours, dec in degrees] */
    function cartesianToSphericalSky(vector: Vector3d): Vector2d;
  }

  class PointList {
    draw(renderContext: RenderContext, opacity: number, cull: boolean, depthMash=false);
  }

  export class Vector2d {
    x: number;
    y: number;
  }

  // merges with the existing Vector3d type
  interface Vector3d {
    /** rotates in place, about the x axis (which points at the equinox) */
    rotateX(radians: number): void;
  }
}
