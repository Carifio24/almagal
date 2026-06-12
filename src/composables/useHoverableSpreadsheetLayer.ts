import { engineStore } from "@wwtelescope/engine-pinia";
import { distance } from "@wwtelescope/astro";
import { useSpreadsheetLayer, type SpreadsheetLayerOptions } from "./useSpreadsheetLayer";
import { ImageSetType } from "@wwtelescope/engine-types";
import { Prettify } from "@/types";
import { Vector3d } from "@wwtelescope/engine";
const D2R = Math.PI / 180;

export interface RaDecPair {
  ra: number;  // degrees
  dec: number; // degrees
}

export interface HoverableSpreadsheetLayerOptions<T extends RaDecPair> extends SpreadsheetLayerOptions {
  pixelThreshold?: number;
  onHover?: (row: T | null, index: number) => void;
  onClick?: (row: T | null, index: number) => void;
}


export function useHoverableSpreadsheetLayer<T extends RaDecPair>(
  rows: T[],
  options: Prettify<HoverableSpreadsheetLayerOptions<T>> = {}
) {

  type ClosestRowFinder = (event: PointerEvent) => { row: T, index: number } | null;

  const store = engineStore();
  const { pixelThreshold = 20, onHover, ...spreadsheetOptions } = options;

  // ra in hours for the WWT layer column
  // const points = rows.map(r => [r.ra / 15, r.dec] as [number, number]);
  // convert row to have ra in hours
  const points = rows.map(r => ({ ...r, ra: r.ra / 15 }));
  const spreadsheet = useSpreadsheetLayer(points, spreadsheetOptions); // create the underlying spreadsheet layer

  // add mouse/pointer trackings (like green-comet, brute force)
  function findClosestRow2D(event: PointerEvent) {
    const pt = { x: event.offsetX, y: event.offsetY };
    const raDecDeg = store.findRADecForScreenPoint(pt);
    const targetRaRad = raDecDeg.ra * D2R;
    const targetDecRad = raDecDeg.dec * D2R;

    let minDist = Infinity;
    let closestIndex = -1;

    // brute-force search through rows
    rows.forEach((row, i) => {
      const dist = distance(targetRaRad, targetDecRad, row.ra * D2R, row.dec * D2R);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    });

    if (closestIndex === -1) return null;

    const closest = rows[closestIndex];
    const screenPoint = store.findScreenPointForRADec({ ra: closest.ra, dec: closest.dec });

    // check if we are within the pixel threshold
    const pixelDist = Math.sqrt((pt.x - screenPoint.x) ** 2 + (pt.y - screenPoint.y) ** 2);

    return pixelDist < pixelThreshold ? { row: closest, index: closestIndex } : null;
  }

  function findClosestRow3D(event: PointerEvent) {
    const halfThreshold = Math.round(0.5 * pixelThreshold);
    const pt = { x: event.offsetX, y: event.offsetY };
    const columnPoints = [
      { x: pt.x + halfThreshold, y: pt.y + halfThreshold },
      { x: pt.x - halfThreshold, y: pt.y + halfThreshold },
      { x: pt.x - halfThreshold, y: pt.y - halfThreshold },
      { x: pt.x + halfThreshold, y: pt.y - halfThreshold },
    ];
    const rayInfo = columnPoints.map(p => store.findRayForScreenPoint(p));
    const vertices: Vector3d[] = [];
    rayInfo.forEach(info => {
      vertices.push(info[0]);
      vertices.push(Vector3d.addVectors(info[0], info[1]));
    });

    const x01 = Vector3d.subtractVectors(vertices[0], vertices[1]);
    const x02 = Vector3d.subtractVectors(vertices[0], vertices[2]);
    const x23 = Vector3d.subtractVectors(vertices[2], vertices[3]);
    const x24 = Vector3d.subtractVectors(vertices[2], vertices[4]);
    const x67 = Vector3d.subtractVectors(vertices[6], vertices[7]);
    const x71 = Vector3d.subtractVectors(vertices[7], vertices[1]);
    const x75 = Vector3d.subtractVectors(vertices[7], vertices[5]);
    const normals: Vector3d[] = [
      Vector3d.cross(x02, x24),
      Vector3d.cross(x67, x71),
      Vector3d.cross(x71, x75).negate(),
      Vector3d.cross(x24, x23).negate(),
      Vector3d.cross(x02, x01).negate(),
      Vector3d.cross(x75, x67),
    ];


    const layer = spreadsheet.getLayer();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error `positions` does exist
    const positions: Vector3d[] = layer.positions;

    const indices = positions.reduce((accumulator, position, index) => {
      if (normals.every(norm => Vector3d.dot(norm, position) < 0)) {
        accumulator.push(index);
      }
      return accumulator;
    }, [] as number[]);

    if (indices.length === 0) {
      return null;
    } else if (indices.length === 1) {
      const index = indices[0];
      return { row: rows[index], index };
    }

    // If there are multiple results, we want to take the closest one
    // As a first pass, we can find the one whose dot product with the central vector is the least

  }

  let lastResult: ReturnType<ClosestRowFinder> = null;
  function onPointerMove(event: PointerEvent) {
    if (store.backgroundImageset?.get_dataSetType() !== ImageSetType.sky) return; // only enable for sky layers
    if (!onHover) return;
    const result = findClosestRow2D(event);
    if (lastResult === null && result === null) return; // both null, no change
    if (result && lastResult?.index === result.index) return; // same row, no change
    onHover(result?.row ?? null, result?.index ?? -1);
    lastResult = result;
  }

  function onPointerDown(_event: PointerEvent) { /* i don't think we need this */ }

  function onPointerUp(_event: PointerEvent) { /* i don't think we need this */ }

  function onPointerClick(event: PointerEvent) {
    if (store.backgroundImageset?.get_dataSetType() !== ImageSetType.sky) return; // only enable for sky layers
    if (!options.onClick) return;
    const result = findClosestRow(event);
    if (result) {
      options.onClick(result.row ?? null, result.index ?? -1);
    }
  }

  return {
    ...spreadsheet,
    onPointerMove,
    onPointerDown,
    onPointerUp,
    onPointerClick,
  };
}
