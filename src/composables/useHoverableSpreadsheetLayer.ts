import { engineStore } from "@wwtelescope/engine-pinia";
import { distance } from "@wwtelescope/astro";
import { useSpreadsheetLayer, type SpreadsheetLayerOptions } from "./useSpreadsheetLayer";
import { ImageSetType } from "@wwtelescope/engine-types";
import { Prettify } from "@/types";
import { Vector3d } from "@wwtelescope/engine";
const D2R = Math.PI / 180;

interface ScreenPoint {
  x : number;
  y: number;
};

export interface RaDecPair {
  ra: number;  // degrees
  dec: number; // degrees
}

export interface HoverableSpreadsheetLayerOptions<T extends RaDecPair> extends SpreadsheetLayerOptions {
  pixelThreshold?: number;
  onHover?: (row: T | null, index: number) => void;
  onClick?: (row: T | null, index: number) => void;
  emitNull?: boolean
}

export function useHoverableSpreadsheetLayer<T extends RaDecPair>(
  rows: T[],
  options: Prettify<HoverableSpreadsheetLayerOptions<T>> = {}
) {

  type ClosestRowFinder = (event: PointerEvent) => { row: T, index: number } | null;

  const store = engineStore();
  const { pixelThreshold = 20, onHover, emitNull = false, ...spreadsheetOptions } = options;

  // ra in hours for the WWT layer column
  // const points = rows.map(r => [r.ra / 15, r.dec] as [number, number]);
  // convert row to have ra in hours
  const points = rows.map(r => ({ ...r, ra: r.ra  }));
  const spreadsheet = useSpreadsheetLayer(points, spreadsheetOptions); // create the underlying spreadsheet layer

  // add mouse/pointer trackings (like green-comet, brute force)
  function findClosestRow2D(event: PointerEvent) {
    const pt = { x: event.offsetX, y: event.offsetY };
    const raDecDeg = store.findRADecForScreenPoint(pt);
    const targetRaRad = raDecDeg.ra * D2R;
    const targetDecRad = raDecDeg.dec * D2R;

    let minDist = Infinity;
    let closestIndex = -1;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error This works
    const layer = spreadsheet.layer.value; const table = layer.get__table(); const tableRows = table.rows; const header = table.header;

    // brute-force search through rows
    tableRows.forEach((row, i) => {
      const ra = +row[layer?.get_lngColumn() ?? 0];
      const dec = +row[layer?.get_latColumn() ?? 1];
      const dist = distance(targetRaRad, targetDecRad, ra * D2R, dec * D2R);
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
    if (pixelDist >= pixelThreshold) return null;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error This works
    if (!layer._filter(tableRows[closestIndex], header)) return null;

    return { row: closest, index: closestIndex };
  }

  function findClosestRow3D(event: PointerEvent) {
    const layer = spreadsheet.layer.value;
    if (!layer) return null;

    const pt: ScreenPoint = { x: event.offsetX, y: event.offsetY };

     
    // @ts-expect-error `positions` does exit
    const positions: Vector3d[] = layer.positions;

    let minDistSq = pixelThreshold ** 2;
    const candidates: [number, number, ScreenPoint][] = [];
    rows.forEach((_row, index) => {
      const position = positions[index];
      if (!position) return;

      const screenPoint = store.findScreenPointForCoordinates({ x: position.x, y: position.z, z: position.y });
      const distSq = (screenPoint.x - pt.x) ** 2 + (screenPoint.y - pt.y) ** 2;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        candidates.push([index, distSq, screenPoint]);
      }
    });

    const finalCandidates = candidates.filter(c => c[1] <= minDistSq);
    if (finalCandidates.length === 0) {
      return null;
    } else if (finalCandidates.length === 1) {
      const index = finalCandidates[0][0];
      return { row: rows[index], index };
    }

    // If there are multiple values, we should sort by depth
    const depths = finalCandidates.map(([index, _distSq, screenPoint]) => {
      const position = positions[index];
      const [near, ray] = store.findRayForScreenPoint(screenPoint);
      // Should be the same for any coordinate, so just pick one
      const z = (position.x - near.x) / ray.x;
      return z;
    });

    let minDepthIndex = 0;
    for (let i = 1; i < depths.length; i++) {
      if (depths[i] < depths[minDepthIndex]) {
        minDepthIndex = i;
      }
    }

    return { row: rows[minDepthIndex], index: minDepthIndex };
  }

  function activeRowFinder(): ClosestRowFinder | null {
    const type = store.backgroundImageset?.get_dataSetType();
    return type === ImageSetType.sky ? findClosestRow2D : (type === ImageSetType.solarSystem ? findClosestRow3D : null);
  }

  let lastResult: ReturnType<ClosestRowFinder> = null;
  function onPointerMove(event: PointerEvent) {
    if (!onHover) return;
    const rowFinder = activeRowFinder();
    if (!rowFinder) return;
    const result = rowFinder(event);
    if (lastResult === null && result === null) return; // both null, no change
    if (result && lastResult?.index === result.index) return; // same row, no change
    onHover(result?.row ?? null, result?.index ?? -1);
    lastResult = result;
  }

  function onPointerDown(_event: PointerEvent) { /* i don't think we need this */ }

  function onPointerUp(_event: PointerEvent) { /* i don't think we need this */ }

  function onPointerClick(event: PointerEvent) {
    if (!options.onClick) return;
    const rowFinder = activeRowFinder();
    if (!rowFinder) return;
    const result = rowFinder(event);
    if (result || emitNull) {
      options.onClick(result?.row ?? null, result?.index ?? -1);
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
