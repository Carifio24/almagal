/* The catalog, the filters and the view flags that both ALMAGAL.vue and the
   tour touch. Module scope rather than ALMAGAL.vue's setup, so the tour can
   just import and call them. */
import { ref, shallowRef } from "vue";
import { engineStore } from "@wwtelescope/engine-pinia";
import type { ImageSetLayer, SpreadSheetLayer } from "@wwtelescope/engine";
import { ScaleTypes } from "@wwtelescope/engine-types";
import {
  almagalSources,
  getAlmagalSourceById,
  getAlmagalSourceUrl,
  type ALMAGalSource,
} from "./almagal_utils";
import { setFitsLayerSettings } from "./wwt-helpers";
import type { Colormaps } from "./wwt-colormaps/colormaps";
import tempo from "@/assets/tempo";
import almagalClumps from "./assets/almagal_clump_props_WWT.json";

export const CLUMP_TYPES = ["isolated", "empty", "simple", "rich", "unknown"];

const getIndex = (type: string) => {
  const index = CLUMP_TYPES.indexOf(type);
  return Math.max(index, 0);
};

// merge almagalClumps "type" and an "included field" based on iid/INTERNAL_ID
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergedCatalog(sources: ALMAGalSource[], clumps: any[]): ( ALMAGalSource & { type: string; included: boolean })[] {
  const clumpMap = new Map(clumps.map(clump => [clump.INTERNAL_ID, clump]));
  return sources.map(source => {
    const clump = clumpMap.get(source.iid);
    const type = clump ? clump.TYPE : "unknown";
    return {
      ...source,
      type,
      included: !!clump,
      color: tempo[getIndex(type)],
    };
  });
}

export const almagalSourceList = shallowRef(mergedCatalog(almagalSources, almagalClumps));

/* ------------------------------------------------------------- filtering -- */

export interface AlmaGalSourceFilterRange { max: number | null; min: number | null }
export type AlmaGalSourceFilterSpec = Map<keyof ALMAGalSource, AlmaGalSourceFilterRange>;

// Numeric source fields exposed as range-filter sliders. Edit this list to add or remove sliders.
export const filterFields = ["mass", "lum", "lm", "tdust", "dist_ag", "tbol"] as const;
export type FilterField = typeof filterFields[number];

// separate filter for clump type, since it is categorical not numeric
export const clumpTypeFilter = ref<string[]>([...CLUMP_TYPES]);

// Full [min, max] of each filterable column, measured from the loaded sources.
export const almagalColumnRanges = filterFields.reduce((ranges, field) => {
  let min = Infinity;
  let max = -Infinity;
  for (const source of almagalSourceList.value) {
    const value = source[field];
    if (typeof value !== "number" || Number.isNaN(value)) continue;
    if (value === -999) continue; // -999 is missing value
    if (value < min) min = value;
    if (value > max) max = value;
  }
  ranges[field] = { min, max };
  return ranges;
}, {} as Record<FilterField, { min: number; max: number }>);

// Seed each filter at its column's full range, so nothing is filtered out until a slider is moved.
const initialFilterSpec = new Map(
  filterFields.map(field => [field, { max: almagalColumnRanges[field].max, min: almagalColumnRanges[field].min }])
);
export const filterSpec = ref<AlmaGalSourceFilterSpec>(initialFilterSpec);

// the use of a ref here means the function will always reflect the latest filter spec.
export function filterFunction(row: string[], header: string[], _index: number, _layer: SpreadSheetLayer): boolean {
  const typeIndex = header.indexOf("type");
  for (const [column, range] of filterSpec.value) {
    const columnIndex = header.indexOf(column);
    const value = +row[columnIndex];
    if (Number.isNaN(value)) return false; // empty value or something else -> false
    if (range.min != null && value < range.min) return false;
    if (range.max != null && value > range.max) return false;
  }

  const ctype = row[typeIndex];
  if (!clumpTypeFilter.value.includes(ctype)) return false;

  return true;
}

/** Cut one column. A null end means "that column's own extreme", i.e. no cut. */
export function setFilterRange(field: FilterField, min: number | null, max: number | null) {
  const range = almagalColumnRanges[field];
  filterSpec.value.set(field, { min: min ?? range.min, max: max ?? range.max });
}

export function resetFilters() {
  filterFields.forEach((field) => setFilterRange(field, null, null));
  clumpTypeFilter.value = [...CLUMP_TYPES];
}

/* ------------------------------------------------------- selection & view -- */

export const selectedAlmagalSource = ref<ALMAGalSource | null>(null);

/* Clump brightness spans orders of magnitude, so one shared stretch cannot suit
   every source. A cut left here is picked up when that layer loads. */
export const sourceStretchOverrides = new Map<ALMAGalSource["iid"], { vmin: number; vmax: number }>();

export const spreadsheetVisible = ref(true);
export const showFilters = ref(false);

/* "none" turns every survey layer off, leaving WWT's own Gaia DR2 sky showing
   through -- the visible-light view, without a survey of our own on top. */
export type BackgroundSurvey = "glimpse" | "herschel" | "none";
export const foregroundImage = ref<BackgroundSurvey>("glimpse");
/** One opacity for whichever survey is showing. */
export const foregroundOpacity = ref(1);

/* ----------------------------------------------------- the ALMA images ---- */

/** settings that will be applied to each fits layer */
export const FITS_LAYER_SETTINGS = {
  cmap: 'rdbu' as Colormaps,
  opacity: 1.0,
  stretch: {
    stretch: ScaleTypes.log,
    vmin: 0,
    vmax: 0.015,
  }
};

export const FITS_LAYER_SETTINGS_RESET = {
  cmap: 'rdbu' as Colormaps,
  opacity: 1.0,
  stretch: {
    stretch: ScaleTypes.log,
    vmin: 0,
    vmax: 0.015,
  }
} as const;

export const almagalSourceLayers = ref<Map<ALMAGalSource["iid"], ImageSetLayer>>(new Map());
export const pendingSourceIids = ref<ALMAGalSource["iid"][]>([]);

const pendingSourceLoads = new Map<ALMAGalSource["iid"], Promise<ImageSetLayer>>();

/* Downloads the user gave up on. addImageSetLayer takes no abort signal, so the
   request keeps running; we stop waiting and drop the layer if it turns up. */
const abandonedLoads = new Set<ALMAGalSource["iid"]>();

/** The shared FITS settings, with any per-source stretch override applied. */
export function fitsSettingsFor(iid: ALMAGalSource["iid"]) {
  const override = sourceStretchOverrides.get(iid);
  if (!override) return FITS_LAYER_SETTINGS;
  return {
    ...FITS_LAYER_SETTINGS,
    stretch: { ...FITS_LAYER_SETTINGS.stretch, ...override },
  };
}

/**
 * Create a fitsimage layer from an ALMAGal source id
 * The create layer get's added to almagalSourceLayers
 */
export function loadAlmaGalFitsSource(iid: ALMAGalSource["iid"]): Promise<ImageSetLayer> {
  const store = engineStore();
  // make sure it has not already been loaded.
  if (almagalSourceLayers.value.has(iid)) {
    return Promise.resolve(almagalSourceLayers.value.get(iid)!);
  }
  // ...or is on its way. Two callers in the same tick would otherwise each add
  // their own layer, since the map above only fills in once the fetch lands.
  const inFlight = pendingSourceLoads.get(iid);
  if (inFlight) {
    return inFlight;
  }

  // otherwise get it's url and load it as a new "fits" ImageSetLayer
  const source = getAlmagalSourceById(iid);
  if (!source) {
    throw new Error(`Source with id ${iid} not found`);
  }

  // keep track of what is being loaded
  if (!pendingSourceIids.value.includes(iid)) {
    pendingSourceIids.value.push(iid);
  }
  const url = getAlmagalSourceUrl(source);
  console.log("Loading ALMAGAL source from url:", source, url);
  console.warn("The CORS is ok. It takes a moment to fetch via WWT Proxy");
  const load = store.addImageSetLayer({
    url: url,
    mode: "fits",
    name: source.aid,
    goto: false,
  }).then(layer => {
    if (abandonedLoads.delete(iid)) {
      store.deleteLayer(layer.id);
      throw new Error(`ALMAGAL source ${iid} download was cancelled`);
    }
    almagalSourceLayers.value.set(iid, layer);
    const idx = pendingSourceIids.value.indexOf(iid);
    if (idx !== -1) pendingSourceIids.value.splice(idx, 1);
    return layer;
  }).finally(() => {
    pendingSourceLoads.delete(iid);
  });
  pendingSourceLoads.set(iid, load);
  return load;
}

/** Fetch one clump's ALMA image and set it up for display. */
export function downloadAlmagalSource(iid: ALMAGalSource["iid"]) {
  return loadAlmaGalFitsSource(iid).then(layer => {
    setFitsLayerSettings(layer.id.toString(), engineStore(), fitsSettingsFor(iid));
    return layer;
  }).catch((error) => {
    console.warn(error); // a cancelled download lands here too
    return null;
  });
}

/** Give up on a download in progress. */
export function cancelAlmagalSourceDownload(iid: ALMAGalSource["iid"]) {
  if (!pendingSourceLoads.has(iid)) return;
  abandonedLoads.add(iid);
  pendingSourceLoads.delete(iid);
  const idx = pendingSourceIids.value.indexOf(iid);
  if (idx !== -1) pendingSourceIids.value.splice(idx, 1);
}
