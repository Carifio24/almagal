/* Everything the tour does to the app: `setupTourStep` puts the view in the
   right state for a step, and the rest are what the step buttons call.
   TOUR_NOTES.md has where the numbers and the example sources come from. */
import { nextTick, reactive } from "vue";
import { engineStore } from "@wwtelescope/engine-pinia";
import { D2R } from "@wwtelescope/astro";
import { useWtmlLoader } from "../composables/useWtmlLoader";
import { goToImageset, showImagesets } from "../wwt-helpers";
import {
  almagalSourceList,
  downloadAlmagalSource,
  foregroundImage,
  infoSheetTab,
  resetFilters,
  selectedAlmagalSource,
  setFilterRange,
  showFilters,
  showInfoSheet,
  sourceStretchOverrides,
  spreadsheetVisible,
  SETTINGS_TAB,
  type BackgroundSurvey,
  type FilterField,
  type InfoSheetTab,
} from "../almagal_state";

export function flyTo(raDeg: number, decDeg: number, zoomDeg: number) {
  const store = engineStore();
  store.gotoRADecZoom({
    raRad: raDeg * D2R,
    decRad: decDeg * D2R,
    zoomDeg,
    rollRad: store.rollRad,
    instant: false,
  });
}

/* The Carina-arm field, shared by the "Massive Star Formation" and "What is the
   ALMAGAL Survey?" steps: AG288.9609+0.2643 at RA 164.4655, Dec -59.4909.
   `flyTo` passes this straight to WWT, whose zoom is SIX TIMES the view height
   -- so 36 is a 6.0deg-tall, 9.6deg-wide field. Wide on purpose: the Carina
   Nebula is 1.63deg off (dl 1.36, db 0.89), and at the old 18 it sat right in a
   corner, which read as the step not being pointed at Carina at all. */
const CARINA_ARM_ZOOM = 36;

export function showBackground(survey: BackgroundSurvey) {
  foregroundImage.value = survey;
}

/** Cut the catalog on one column, with the sliders and the markers showing. */
export function filterCatalog(field: FilterField, min: number | null, max: number | null) {
  showFilters.value = true;
  spreadsheetVisible.value = true;
  setFilterRange(field, min, max);
}

/** Fly to an ALMAGAL clump, open its panel and fetch its ALMA image. */
export function goToSource(aid: string, vmin: number, vmax: number) {
  const source = almagalSourceList.value.find(s => s.aid === aid);
  if (!source) {
    console.warn(`tour: no ALMAGAL source named ${aid}`);
    return;
  }
  sourceStretchOverrides.set(source.iid, { vmin, vmax });
  selectedAlmagalSource.value = source;
  // selecting flies there but deliberately leaves the zoom alone, so set it
  // after that move has been issued. The images are about 36 arcsec across.
  nextTick(() => flyTo(source.ra, source.dec, 0.09));
  downloadAlmagalSource(source.iid);
}

/* Orion, the nearest high-mass star-forming region. The indices are the order
   of the places in the WTML file. Loaded on first use, never at import time,
   since useWtmlLoader needs an active pinia. */
export const ORION = { hubble: 0, spitzer: 1, wise: 2 };

function loadOrion() {
  return reactive(useWtmlLoader("./orion_m42_wide.wtml", {
    autoload: true,
    onLoad: (out) => out.layer?.set_enabled(false),
  }));
}

let orionWtml: ReturnType<typeof loadOrion> | null = null;

export function orion() {
  if (!orionWtml) {
    orionWtml = loadOrion();
  }
  return orionWtml;
}

function setInfoSheet(tab: InfoSheetTab | null) {
  if (tab === null) {
    showInfoSheet.value = false;
    return;
  }
  infoSheetTab.value = tab;
  showInfoSheet.value = true;
}

/** Put the app into the starting state for a step. Steps are 1-indexed. */
export function setupTourStep(n: number) {
  if (n === 1 || n === 2) { // Massive Stars
    setInfoSheet(null);
    selectedAlmagalSource.value = null;
    showFilters.value = false;
    showBackground("glimpse");
    const wtml = orion();
    wtml.ready.then(() => {
      showImagesets(wtml, ORION.hubble);
      goToImageset(wtml, ORION.hubble, { zoom: 3, instant: false });
    });
    return;
  }

  if (n === 3 || n === 4) { // Massive Star Formation
    setInfoSheet(null);
    showImagesets(orion());
    selectedAlmagalSource.value = null;
    showFilters.value = false;
    spreadsheetVisible.value = true;
    // start in visible light -- WWT's own Gaia DR2 sky -- where the clump is hiding
    showBackground("none");
    flyTo(164.4655, -59.4909, CARINA_ARM_ZOOM);
    return;
  }

  if (n === 5 || n === 6) { // What is the ALMAGAL Survey?
    // 6 discusses filters
    setInfoSheet(null);
    showImagesets(orion());
    selectedAlmagalSource.value = null;
    resetFilters();
    spreadsheetVisible.value = true;
    // the far-IR survey the targets were picked from
    showBackground("herschel");
    flyTo(164.4655, -59.4909, CARINA_ARM_ZOOM);
    return;
  }

  if (n === 7 || n === 8) { // Information on the data
    setInfoSheet(SETTINGS_TAB);
    showImagesets(orion());
    resetFilters();
    spreadsheetVisible.value = true;
    showFilters.value = true;
    showBackground("glimpse");
    return;
  }

  console.warn("tour does not have step", n);
}
