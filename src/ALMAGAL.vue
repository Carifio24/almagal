<template>
  <v-app
    id="app"
    :style="cssVars"
    :class="[smallSize ? 'app-is-small' : '', isLandscape ? 'app-is-landscape' : '', sidePanel ? 'app-side-panel' : '']"
  >
    <!-- ahead of #main-content in the markup so the tab order follows the
         visual one; `order` moves a flex item without moving it for the keyboard.

         'push' and 'bottom' want the drawer right here, as a flex sibling of
         #main-content. 'float' does not: it sits over the view's lower-left
         corner, which used to mean padding #bottom-content past a width the
         overlay could not see. Teleporting it into the overlay's own bottom row
         instead makes it a real flex item there, so the control bar flows
         beside it. `defer` waits for that target to render; `disabled` leaves
         the drawer in place for the other two layouts. One call either way. -->
    <Teleport
      defer
      to="#tour-float-slot"
      :disabled="tourDrawerLayout !== 'float'"
    >
      <SideDrawer
        id="tour-drawer"
        :open="showTour"
        :layout="tourDrawerLayout"
        location="bottom left"
        :side-drawer-width="tourDrawerWidth"
        float-max-height="100vh"
      >
        <div class="tour-sheet">
          <v-btn
            class="tour-sheet-close"
            density="compact"
            variant="text"
            icon="mdi-close"
            aria-label="Close the tour"
            @click="showTour = false"
          />
          <TourPlayer />
        </div>
      </SideDrawer>
    </Teleport>

    <div
      id="main-content"
    >
      <WorldWideTelescope
        ref="wwt-container"
        :wwt-namespace="wwtNamespace"
        @pointermove="almagalSpreadsheetLayer.onPointerMove"
        @click="almagalSpreadsheetLayer.onPointerClick"
      ></WorldWideTelescope>
      <wwt-loader v-model="isLoading" />


      <!-- This contains the splash screen content -->
      <SplashScreen
        v-model="showSplashScreen"
        :accent-color="almagalBlue"
        :highlight-color="almagalOrange"
        :loaded="!isLoading"
      />


      <!-- This block contains the elements (e.g. icon buttons displayed at/near the top of the screen -->
      <div
        v-show="!(showSplashScreen)"
        id="wwt-overlay"
      >
        <div id="top-content">
          <!-- old left-buttons / right-buttons layout preserved below -->
          <div id="left-buttons">
            <div 
              class="source-controls"
              :class="{
                'flex-column': showFilters,
              }"
            >
              <div class="d-flex flex-column align-start ga-2">
                <wwt-3d-switch
                  @3d="setup3DView"
                >
                  <template #default="{ onClick}">
                    <!-- <v-btn
                      variant="outlined"
                      size="small"
                      class="blur-button"
                      @click="onClick"
                    >
                      {{ in3dView ? "Switch to 2D" : "Switch to 3D" }}
                    </v-btn> -->
                    <div class="d-flex align-center">
                      <!-- <div>2D</div> -->
                      <v-switch
                        :model-value="in3dView"
                        inset
                        append-icon="mdi-video-3d"
                        true-icon="mdi-video-3d"
                        prepend-icon="mdi-video-2d"
                        false-icon="mdi-video-2d"
                        hide-details
                        density="compact"
                        @click="onClick"
                      />
                      <!-- <div>3D</div> -->
                    </div>
                  </template>
                </wwt-3d-switch>
                <div
                  v-if="!in3dView"
                  class="d-flex align-center ga-2"
                >
                  <v-tooltip
                    text="Search for source"
                    location="bottom"
                  >
                    <template #activator="p">
                      <v-btn
                        v-bind="p.props"
                        :icon="showSearch ? 'mdi-close' : 'mdi-magnify'"
                        size="small"
                        color="surface-variant"
                        @click="showSearch = !showSearch"
                      />
                    </template>
                  </v-tooltip>
                  <template v-if="showSearch">
                    <v-autocomplete
                      v-if="almagalSourceList"
                      v-model="selectedAlmagalSource"
                      class="almagal-v-select on-canvas"
                      :items="almagalSourceList"
                      item-title="iid"
                      item-value="iid"
                      return-object
                      hide-details
                      label="ALMAGAL Source"
                      :loading="pendingSourceIids.length > 0"
                      autofocus
                      density="compact"
                    />
                  </template>
                </div>


                <v-tooltip
                  text="View settings"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-tune-vertical"
                      size="small"
                      color="surface-variant"
                      aria-label="Comparison image settings"
                      @click="openSettings"
                    />
                  </template>
                </v-tooltip>

                <v-tooltip
                  text="User guide"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-help"
                      size="small"
                      color="surface-variant"
                      aria-label="Open the user guide"
                      @click="openUserGuide"
                    />
                  </template>
                </v-tooltip>
                <v-tooltip
                  text="tour"
                  location="bottom"
                >
                  <template #activator="p">
                    <v-btn
                      v-bind="p.props"
                      icon="mdi-transit-connection-variant"
                      size="small"
                      color="surface-variant"
                      aria-label="Start the tour"
                      @click="showTour = !showTour"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>
          </div>
          <div id="right-buttons">
            <button
              class="learn-more-card"
              @click="showTour = !showTour"
            >
              <span class="learn-more-text">
                Learn More About ALMAGAL
              </span>
              <img
                src="https://battersby-physics.media.uconn.edu/wp-content/uploads/sites/2230/2020/09/ALMAGAL_Logo1_SM.jpg"
                alt="ALMAGAL logo"
                class="learn-more-logo"
              />
            </button>
            <div class="d-flex flex-row flex-wrap ga-4 pa-2 bunch-o-buttons">
            </div>
            <div
              v-if="!in3dView"
            >
              <div
                v-for="layer in almagalWtml.imagesetLayers"

                :key="layer.id.toString()"
                class="layer-list__item elevation-2 my-2"
              >
                <ImagesetItem
                  style="color: black"
                  :imageset="store.imagesetStateForLayer(layer.id.toString())!"
                  instant
                  :crange="{min: -0.001, max: 1}"
                  log-stretch-slider
                  @reset="() => setFitsLayerSettings(layer.id.toString(), store, FITS_LAYER_SETTINGS_RESET)"
                >
                  <template #name>
                    Image Settings
                  </template>
                </ImagesetItem>
              </div>
            </div>
            <div class="hovered-source-info">
              <span v-if="hoveredSource">Currently hovering: {{ hoveredSource.aid }}</span>
              <span v-else-if="selectedAlmagalSource">Last selected: {{ selectedAlmagalSource.aid }}</span>
              <span v-else>Currently hovering: none</span>
              <v-btn
                v-if="hoveredSource || selectedAlmagalSource"
                style="pointer-events: auto;"
                class="ml-2"
                density="compact"
                icon="mdi-information-slab-circle-outline"
                @click="openSourceInfo"
              >
              </v-btn>
            </div>
            <v-btn
              v-if="showAllInView && !in3dView"
              class="blur-button"
              variant="outlined"
              @click="showAllSourcesInView"
            >
              Get {{ sourcesInView.count }} source{{ sourcesInView.count > 1 ? 's' : '' }} in view
            </v-btn>
            <div 
              v-else 
              class="blur-background  py-2 px-4 rounded"
              style="max-width: 220px;"
            >
              Zoom in to download full images
            </div>
            <div
              v-if="(almagalSourceLayers.size > 0 || pendingSourceIids.length > 0 || selectedAlmagalSource) && !in3dView"
              class="layer-list"
            >
              <div
                v-for="layer in [...almagalSourceLayers.values()]"
                :key="layer.id.toString()"
                class="layer-list__item"
              >
                <ImagesetItem
                  v-if="store.imagesetStateForLayer(layer.id.toString())"
                  style="color: black"
                  :imageset="store.imagesetStateForLayer(layer.id.toString())!"
                  instant
                  log-stretch-slider
                  hide-opacity
                  hide-colormap
                  hide-vrange
                  hide-reset
                  no-open
                />
              </div>
              <DownloadAlmagal
                v-for="iid in pendingSourceIids"
                :key="iid"
                :iid="iid"
                pending
                @download="downloadAlmagalSource"
                @cancel="cancelAlmagalSourceDownload"
              />
              <!-- the selected clump, so its image can be fetched on demand -->
              <DownloadAlmagal
                v-if="selectedAlmagalSource
                  && !pendingSourceIids.includes(selectedAlmagalSource.iid)
                  && !almagalSourceLayers.has(selectedAlmagalSource.iid)"
                :iid="selectedAlmagalSource.iid"
                :pending="false"
                @download="downloadAlmagalSource"
                @cancel="cancelAlmagalSourceDownload"
              />
            </div>
          </div>
        </div>


        <!-- This block contains the elements (e.g. the project icons) displayed along the bottom of the screen -->

        <div id="bottom-content">
          <div class="bottom-main">
            <!-- Where the floating tour lands (see the Teleport above). Empty
                 and zero-width for the other two layouts. -->
            <div id="tour-float-slot"></div>
            <div class="control-bar">
              <v-btn
                class="blur-button"
                variant="outlined"
                :prepend-icon="spreadsheetVisible ? 'mdi-eye-off' : 'mdi-eye'"
                @click="spreadsheetVisible = !spreadsheetVisible"
              >
                {{ spreadsheetVisible ? 'Hide Catalog' : 'Show Catalog' }}
              </v-btn>
            </div>
          </div>
          <div
            id="body-logos"
            :class="{'small-logos': smallSize}"
          >
            <credit-logos
              :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa']"
              :logo-size="smallSize ? '1em' : '1.5em'"
              :extra-logos="[
                {
                  alt: 'ALMAGAL',
                  src: 'https://battersby-physics.media.uconn.edu/wp-content/uploads/sites/2230/2020/09/ALMAGAL_Logo1_SM.jpg',
                  href:'https://www.almagal.org',
                  name: 'ALMAGAL: ALMA Evolutionary study of High Mass Protocluster Formation in the Galaxy'
                }
              ]"
            />
          </div>
        </div>
      </div>
    </div>
    <WebGlTest
      @webgl2-disabled="webglDisabled = true"
    />
    <!--
      NEW: a plain div is a flex sibling of #main-content inside
      .v-application__wrap, so opening it pushes/shrinks the WWT view rather
      than covering it. #main-content has `order: 2`, which puts this panel on
      the left in the row layout, and below the view when the app is small.
    -->
    <div
      id="side-drawer"
      :class="[sidePanel ? 'info-side' : 'info-bottom', showInfoSheet ? 'side-drawer-open' : 'side-drawer-closed']"
    >
      <!-- 
      The Information sheet now will create tabs based on the content of the sheet
       -->
      <InformationSheet
        v-model="showInfoSheet"
        v-model:tab="infoSheetTab"
        tab-color="white"
        :slider-color="almagalOrange"
        :accent-color="almagalBlue"
        text-color="#e6e6e6"
        :bg-color="almagalBlue"
        page-color="transparent"
        :stay-open="forceInfoSheetOpen"
      >
        <!-- each page registers its own tab, in this order -->
        <InfoPage v-if="infoSheetTab === SOURCE_INFORMATION_TAB" title="ALMAGAL Source" value="source-information">
          <AlmaGalSourceInfoDisplay
            v-if="currentSource && !in3dView"
            :source="currentSource"
          />
          <p v-else>
            Hover over or click one of the green markers to see a clump's properties here.
          </p>
        </InfoPage>
        
        <InfoPage v-if="inInfoGroup" title="ALMAGAL">
          ALMAGAL Survey Informational blurb
        </InfoPage>

        <!-- The UserGuide itself is an InfoPage
         so it can be included with wrapping it here.
         Useful for long componenets that can be easily placed in a different file.
          -->
        <UserGuide v-if="inInfoGroup" />

        <InfoPage v-if="infoSheetTab === SETTINGS_TAB" title="Settings">
          <div class="settings-page">
            <v-expansion-panels
              v-model="settingsPanels"
              variant="accordion"
              multiple
              eager
              elevation="0"
            >
              <v-expansion-panel title="Filters" value="filters">
                <v-expansion-panel-text>
                  <fieldset
                    class="almagal-filterset"
                  >
                    <!-- mass, lum, lm, tdust, dist_ag, tbol -->
                    <div
                      v-for="field in filterFields"
                      :key="field"
                      class="filter-slider"
                    >
                      <label>
                        <span v-html="filterFieldLabels[field]"></span>&nbsp;
                        <span
                          v-if="hoveredSource"
                          class="fiducial-display"
                        >
                          {{ formatSigFigs(hoveredSource[field]) }}
                        </span>
                        <RangeNumberInputs
                          :model-value="filterSpec.get(field)!"
                          :min="almagalColumnRanges[field].min"
                          :max="almagalColumnRanges[field].max"
                          :fiducial="hoveredSource ? hoveredSource[field] : undefined"
                          :steps="500"
                          log
                          @update:model-value="(val) => filterSpec.set(field, val)"
                        />
                      </label>
                    </div>
                    <hr class="mt-3" />
                    <div class="clump-type-filter">
                      <span>Clump type</span>
                      <div class="clump-type-options">
                        <label
                          v-for="type in CLUMP_TYPES"
                          :key="type"
                          class="clump-type-option"
                        >
                          <input
                            v-model="clumpTypeFilter"
                            type="checkbox"
                            :value="type"
                          />
                          {{ type }}
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Background Survey" value="background">
                <v-expansion-panel-text>
                  <v-select
                    v-model="foregroundImage"
                    class="almagal-v-select mb-4"
                    :items="foregroundImageOptions"
                    item-title="label"
                    item-value="value"
                    hide-details
                    autofocus
                    label="Background survey"
                    density="compact"
                    variant="underlined"
                  />
                  <p class="settings-hint">
                    Opacity of {{ foregroundImageLabel }} (foreground image) over the backgroun GAIA DR2 image.
                  </p>
                  <v-slider
                    v-model="foregroundOpacity"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    hide-details
                    density="compact"
                    prepend-icon="mdi-opacity"
                    aria-label="Background survey opacity"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
              <v-expansion-panel title="Comparison images" value="comparison">
                <v-expansion-panel-text>
                  <template v-if="in3dView">
                    <p class="settings-hint">
                      Comparison images are only available in the 2D sky view.
                    </p>
                  </template>
                  <template v-else-if="comparisonItems.length > 0">
                    <v-select
                      :model-value="comparisonIndex === -1 ? null : comparisonIndex"
                      :items="comparisonItems"
                      item-title="label"
                      item-value="value"
                      hide-details
                      density="compact"
                      label="Comparison image"
                      variant="outlined"
                      @update:model-value="goToComparison"
                    />
                    <div class="settings-row">
                      <v-btn
                        variant="text"
                        icon="mdi-chevron-left"
                        size="small"
                        aria-label="Previous comparison image"
                        @click="stepComparison(-1)"
                      />
                      <v-btn
                        variant="text"
                        icon="mdi-chevron-right"
                        size="small"
                        aria-label="Next comparison image"
                        @click="stepComparison(1)"
                      />
                      <v-btn
                        variant="text"
                        size="small"
                        :icon="comparisonsVisible ? 'mdi-eye-off' : 'mdi-eye'"
                        :aria-label="comparisonsVisible ? 'Hide comparison images' : 'Show comparison images'"
                        @click="comparisonsVisible = !comparisonsVisible"
                      />
                      <v-btn
                        variant="text"
                        size="small"
                        :icon="showAllComparisons ? 'mdi-layers-triple' : 'mdi-layers-triple-outline'"
                        :aria-label="showAllComparisons ? 'Show only the selected comparison image' : 'Show all comparison images'"
                        @click="toggleShowAllComparisons"
                      />
                    </div>
                    <v-slider
                      v-model="comparisonOpacity"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      hide-details
                      density="compact"
                      prepend-icon="mdi-opacity"
                      aria-label="Comparison image opacity"
                    />
                    <p
                      v-if="currentComparisonDescription"
                      class="settings-description"
                    >
                      {{ currentComparisonDescription }}
                    </p>
                  </template>
                  <p
                    v-else
                    class="settings-hint"
                  >
                    Still loading the comparison image collection.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
        </InfoPage>
        <!--  -->
      </InformationSheet>
    </div>
  </v-app>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, reactive, computed, nextTick, onMounted, watch, shallowRef } from "vue";
import { useDisplay } from "vuetify";
import { storeToRefs } from "pinia";

/* WWT imports */
import { GotoRADecZoomParams, engineStore, ImageSetLayerState } from "@wwtelescope/engine-pinia";
import {
  BackgroundImageset,
  skyBackgroundImagesets,
  supportsTouchscreen,
  useWWTKeyboardControls,
  useFullscreen,
} from "@cosmicds/vue-toolkit";
import { D2R  } from "@wwtelescope/astro";
import {
  WWTControl,
  LayerManager,
  Place,
  Imageset,
  TileCache,
  Coordinates,
  Color,
  SpreadSheetLayer,
} from "@wwtelescope/engine";
// scale types: linear, log, power, sqrt, histogramEqualization
import { ScaleTypes, RAUnits, AltTypes, AltUnits, MarkerScales, PlotTypes } from "@wwtelescope/engine-types";
import { addCustomColormaps, COLORMAPS, type Colormaps  } from "./wwt-colormaps/colormaps";
addCustomColormaps();

/* local components and composables */
import WebGlTest from "./components/WebGlTest.vue";
const webglDisabled = ref(false);


import SplashScreen from "./components/SplashScreen.vue";
import SideDrawer from "./components/SideDrawer.vue";
import InformationSheet from "./components/InformationSheet.vue";
import InfoPage from "./components/InfoPage.vue";
import DownloadAlmagal from "./components/DownloadAlmagal.vue";
import UserGuide from "./components/UserGuide.vue";
import ImagesetItem from "./components/ImagesetItem.vue";
import RangeNumberInputs from "./components/RangeNumberInputs.vue";
import Wwt3dSwitch from "./components/Wwt3dSwitch.vue";
import TourPlayer from "./tour/TourPlayer.vue";
/* Catalog, filters and view flags shared with the tour; see almagal_state.ts */
import {
  CLUMP_TYPES,
  FITS_LAYER_SETTINGS,
  FITS_LAYER_SETTINGS_RESET,
  almagalColumnRanges,
  almagalSourceLayers,
  cancelAlmagalSourceDownload,
  downloadAlmagalSource,
  almagalSourceList,
  clumpTypeFilter,
  filterFields,
  filterFunction,
  filterSpec,
  foregroundImage,
  foregroundOpacity,
  pendingSourceIids,
  selectedAlmagalSource,
  showFilters,
  spreadsheetVisible,
  type FilterField,
} from "./almagal_state";

import { useWtmlLoader } from "./composables/useWtmlLoader";
import { useHoverableSpreadsheetLayer } from "./composables/useHoverableSpreadsheetLayer";
import { useSourcesInView } from "./composables/useSourcesInView";
import { moveToImageset, setFitsLayerSettings } from "./wwt-helpers";

import {
  formatSigFigs,
  type ALMAGalSource
} from "./almagal_utils";
import AlmaGalSourceInfoDisplay from "./components/AlmaGalSourceInfoDisplay.vue";
import { useSpreadsheetLayer } from "./composables/useSpreadsheetLayer";

type CameraParams = Omit<GotoRADecZoomParams, "instant">;
export interface WwtPlaygroundProps {
  wwtNamespace?: string;
  initialCameraParams?: CameraParams;
}

const fullscreen = useFullscreen();
const searchParams = new URLSearchParams(window.location.search);
const kiosk = searchParams.get("kiosk")?.toLowerCase() === "true";
if (kiosk) {
  document.body.classList.add("kiosk");
}

const skipSplash = searchParams.get("splash")?.toLowerCase() === "false";
console.log("kiosk mode?", kiosk);
console.log("skip splash?", skipSplash);
const store = engineStore();
const {
  zoomDeg,
} = storeToRefs(store);

useWWTKeyboardControls(store);

/* Properties related to device/screen characteristics */
const touchscreen = supportsTouchscreen();
const  { smAndDown, width: viewportWidth, height: viewportHeight } = useDisplay();
const isVertical = computed(() => viewportHeight.value > viewportWidth.value);
const smallSize = computed(() => smAndDown.value);
const isLandscape = computed(() => viewportWidth.value > viewportHeight.value * 1.25);
// Where the info sheet lives: beside the view when there's width to spare,
// otherwise across the bottom. A tall/portrait window gets the bottom panel
// even when it's wide enough not to count as `smallSize`.
const sidePanel = computed(() => isLandscape.value || (!smallSize.value && !isVertical.value));

// default to the galactic center
const props = withDefaults(defineProps<WwtPlaygroundProps>(), {
  wwtNamespace: "wwt-playground",
  initialCameraParams: () => {
    return {
      raRad: 266.448 * D2R,
      decRad:  -28.969 * D2R,
      zoomDeg: 1.5,
      rollRad: 0,
    };
  }
});

const backgroundImagesets = reactive<BackgroundImageset[]>([]);
const showInfoSheet = ref(false);
const forceInfoSheetOpen = ref(true);
// Each info sheet registers a tab when it is available in the DOM
const SOURCE_INFORMATION_TAB = "source-information";
const ALMAGAL_TAB = "almagal";
const SETTINGS_TAB = "settings";
const USER_GUIDE_TAB = "user-guide";
type InfoSheetTab = typeof SOURCE_INFORMATION_TAB | typeof ALMAGAL_TAB | typeof SETTINGS_TAB
  | typeof USER_GUIDE_TAB;
// the pages that mount together, and so show up as each other's tabs
const infoGroupTabs: InfoSheetTab[] = [ALMAGAL_TAB, USER_GUIDE_TAB];
const infoSheetTab = ref<InfoSheetTab>(ALMAGAL_TAB);
const inInfoGroup = computed(() => infoGroupTabs.includes(infoSheetTab.value));
/* The info button only appears once a clump is hovered or selected, so the
   sheet needs its own way in for settings that have nothing to do with a clump. */
function openSettings() {
  infoSheetTab.value = SETTINGS_TAB;
  showInfoSheet.value = true;
}
function openUserGuide() {
  infoSheetTab.value = USER_GUIDE_TAB;
  showInfoSheet.value = true;
}
/* Each page is mounted only for its own tab, so a button that opens the sheet
   has to say which tab it means -- this one is about the clump. Still a toggle:
   pressing it again with the clump's page already up closes the sheet. */
function openSourceInfo() {
  if (showInfoSheet.value && infoSheetTab.value === SOURCE_INFORMATION_TAB) {
    showInfoSheet.value = false;
    return;
  }
  infoSheetTab.value = SOURCE_INFORMATION_TAB;
  showInfoSheet.value = true;
}

/* Which shape the tour drawer takes is ours to decide, not the drawer's. It
   reads `sidePanel`, which also sets the container's flex direction, so the two
   cannot disagree. */
const showTour = ref(false);
const tourDrawerLayout = computed<"bottom" | "push" | "float">(() => {
  if (!sidePanel.value) return "bottom";
  /* 700, not 600: 'float' shares the overlay's height with #top-content, so an
     expanded filter panel and the tour push each other off a short screen.
     'push' takes its room from the view's width instead, sidestepping that. */
  return viewportHeight.value >= 700 ? "float" : "push";
});
/* Both are percentages of the drawer's container, which differs per layout:
   'push' sits in .v-application__wrap and takes a third of the window, while
   'float' now lays out inside the overlay's bottom row, so its half is half of
   whatever the view has left once the info sheet has taken its share. */
const tourDrawerWidth = computed(() => tourDrawerLayout.value === "push" ? "34%" : "50%");
const showSearch = ref(false);
const queryShowSplash = searchParams.get("splash")?.toLowerCase() !== 'false';
const showSplashScreen = ref(queryShowSplash);
const layersLoaded = ref(false);
const positionSet = ref(false);
const almagalBlue = ref("#306C9F");
const almagalBlueDarker = ref("#002f5c");
const almagalOrange = ref("#FC9954");
const almagalOrangeDarker = ref("##c05000");
// all panels are open by default.
const settingsPanels = ref<("filters" | "background" | "comparison")[]>(['filters', 'background', 'comparison']);
watch(settingsPanels, (newVal) => {
  console.log("settingsPanels changed:", newVal);
});

const hoveredSource = ref<ALMAGalSource | null>(null);
const MAX_ITEMS_TO_SHOW = 4;
const sourcesInView= useSourcesInView(almagalSourceList.value);
const showAllInView = computed(() => sourcesInView.count > 0 && sourcesInView.count <= MAX_ITEMS_TO_SHOW);

function showAllSourcesInView() {
  sourcesInView.sourcesInView.forEach(source => downloadAlmagalSource(source.iid));
}

// { onPointerMove, onPointerClick, createLayer: setupSpreadsheet, setFilter, applyFilter, show: showSpreadsheet, hide: hideSpreadsheet, setVisible: setSpreadsheetVisible }
const almagalSpreadsheetLayer = useHoverableSpreadsheetLayer(
  almagalSourceList.value,
  {
    name: "ALMAGAL Sources",
    color: "#32CD32",
    markerSize: 7,
    markerType: "point",
    distanceColumn: "dist_ag",
    raUnit: RAUnits.degrees,
    emitNull: true,
    onHover: (row, index) => { 
      if (spreadsheetVisible.value) {
        hoveredSource.value = row as ALMAGalSource | null; 
      }
    },
    onClick: (row) => {
      if (spreadsheetVisible.value) {
        selectedAlmagalSource.value = row as ALMAGalSource;
      }
    },
  }
);
watch(spreadsheetVisible, (visible) => {
  almagalSpreadsheetLayer.setVisible(visible);
});

watch(zoomDeg, (zoom: number) => {
  spreadsheetVisible.value = zoom > 0.5;
});


/* Load WTMLS for different background layers.
   Don't forget to add them to `foregroundImageOptions` and the `foregroundImage` watcher!
*/
// In principle we could use autoload: true. But it is useful to try to load things in order
// newer GLIMPSE 360
const glimpse = useWtmlLoader('./GLIMPSE_360.wtml', {autoload: false});

// Start this disabled. Use herschelPacs.show() to show it. It has a black layer which
const herschel = useWtmlLoader('./herschel_spire_rgb.wtml', {autoload: false, onLoad: (out) => {
  out.layer?.set_enabled(false);
}});

/* WWT study images falling within 5' of an ALMAGAL source.
   Only one is ever enabled: the collection piles many images onto the same few
   star-forming complexes (fourteen of Carina alone), so showing them all at once
   just stacks them on top of each other. Every layer therefore starts disabled
   and `updateComparisonLayers` turns on the selected one (or all of them, if
   the user asks for that).
*/
// const comparisons = reactive(useWtmlLoader('./almagal_sources_wwt_matches.wtml', {
const comparisons = reactive(useWtmlLoader('./almagal_tour_images.wtml', {
  autoload: false,
  onLoad: (out) => out.layer?.set_enabled(false),
}));

/* Stepping through the comparison images.
   Indexed rather than keyed by name: the WWT catalogs reuse names heavily (this
   collection has eleven repeated names, five of them "Eta Carinae"), so a name
   is not enough to identify a place. -1 means "nothing selected yet".
*/
const comparisonIndex = ref(-1);
const comparisonsVisible = ref(true);
const comparisonItems = computed(() => comparisons.places.map((place, index) => ({
  // Number them so the repeated names stay tellable apart.
  label: `${index + 1}. ${place.get_name()}`,
  value: index,
})));
const currentComparisonDescription = computed(() => {
  const place = comparisons.places[comparisonIndex.value];
  if (!place) return null;
  // Most entries only carry a description on the imageset (or none at all, just credits).
  const imageset = place.get_studyImageset() ?? place.get_backgroundImageset();
  return place.htmlDescription || imageset?.get_creditsText() || null;
});

// One opacity for all of them, applied to whichever layers are being turned on.
const comparisonOpacity = ref(1);

// The escape hatch from the one-at-a-time rule: every layer on at once, stacked.
const showAllComparisons = ref(false);

/** Enable the comparison layers that should be showing. */
function updateComparisonLayers() {
  comparisons.imagesetLayers.forEach((layer, i) => {
    const enabled = comparisonsVisible.value &&
      (showAllComparisons.value || i === comparisonIndex.value);
    layer.set_enabled(enabled);
    if (enabled) {
      layer.set_opacity(comparisonOpacity.value);
    }
  });
}

watch([comparisonsVisible, comparisonOpacity, showAllComparisons], updateComparisonLayers);

function toggleShowAllComparisons() {
  showAllComparisons.value = !showAllComparisons.value;
  if (showAllComparisons.value) {
    // no point stacking them all up if they are see-through
    comparisonOpacity.value = 1;
  }
  updateComparisonLayers();
}

function goToComparison(index: number) {
  const layer = comparisons.imagesetLayers[index];
  if (!layer) return;
  comparisonIndex.value = index;
  // Showing the image is implied by asking to fly to it, and asking for one
  // image means one image.
  comparisonsVisible.value = true;
  showAllComparisons.value = false;
  updateComparisonLayers();
  moveToImageset(layer, store, true);
}

function stepComparison(delta: number) {
  const count = comparisons.imagesetLayers.length;
  if (count === 0) return;
  // With nothing selected, Next should land on the first image and Back on the
  // last, so start just outside whichever end we are stepping away from.
  const from = comparisonIndex.value >= 0 ? comparisonIndex.value : (delta > 0 ? -1 : 0);
  goToComparison((from + delta + count) % count);
}

const showBackgroundPicker = ref(false);
const foregroundImageOptions = [
  { label: 'GLIMPSE 360', value: 'glimpse' },
  { label: 'Herschel SPIRE (color)', value: 'herschel' },
  { label: 'None — Gaia DR2 sky', value: 'none' },
];
const foregroundImageLabel = computed(() =>
  foregroundImageOptions.find(o => o.value === foregroundImage.value)?.label ?? '');
watch(foregroundImage, (val) => {
  // "none" falls through to hiding both, which leaves WWT's Gaia DR2 background
  if (val === 'glimpse') { glimpse.show(); herschel.hide(); }
  else if (val === 'herschel') { herschel.show(); glimpse.hide(); }
  else { glimpse.hide(); herschel.hide(); }
  applyForegroundOpacity();
});

/* The loaders' show()/hide() work on `enabled`, so opacity is a separate knob.
   Applied to both collections: whichever is enabled is the one it shows on. */
function applyForegroundOpacity() {
  [glimpse, herschel].forEach(wtml => {
    wtml.imagesetLayers.value.forEach(layer => layer.set_opacity(foregroundOpacity.value));
  });
}
watch(foregroundOpacity, applyForegroundOpacity);

// load either the individual image "./index.wtml" or the tiled version './gal_plane_toast/index_rel.wtml'
const url = './almagal.wtml';

const almagalWtmlState = ref<ImageSetLayerState | null>(null); // This will go into the ImagesetItem to control our fits properties
// Load the WTML. This goes down to level 12
const almagalWtml = reactive(useWtmlLoader(url, {
  autoload: false,
  onLoad: (out, index) => {
    // out contains: folder, place, imageset, layer.
    console.log(`Loaded place ${out.place.get_name()} at index ${index}`);
    if (out.layer) {
      setFitsLayerSettings(out.layer.id.toString(), store, FITS_LAYER_SETTINGS);
      almagalWtmlState.value = store.imagesetStateForLayer(out.layer.id.toString());
    }

  },
  goTo: false, // to go to the first imageset in the WTML  replace false with (_, index) => index === 0
  instant: true,
  useFits: false , // this should be false when using a tiled layer, even if it is fits tiles. set true if loading a non-tiled fits layer.
})
);

const sunCSV = `
ra,dec,d
106.069042627535,-11.4743592401899,1E-8
`;
function createSunLayer() {
  /* idk what i did wrong with this */
  // return store.createTableLayer({
  //   referenceFrame: "Sky",
  //   name: "The Sun",
  //   dataCsv: sunCSV.replace(/\n/g, "\r\n")
  // }).then(layer => {
  //   layer.set_lngColumn(0);
  //   layer.set_latColumn(1);
  //   layer.set_altColumn(2);
  //   layer.set_raUnits(RAUnits.degrees);
  //   layer.set_altUnit(AltUnits.parsecs);
  //   layer.set_altType(AltTypes.distance);
  //   layer.set_showFarSide(true);
  //   layer.set_markerScale(MarkerScales.screen);
  //   layer.set_plotType(PlotTypes.gaussian);
  //   layer.set_opacity(1);
  //   layer.set_scaleFactor(100);
  //   store.applyTableLayerSettings({
  //     id: layer.id.toString(),
  //     settings: [
  //       ["color", Color.load('#ffff0a')],
  //       ["scaleFactor", 100]
  //     ]
  //   });
  //   return layer;
  // });

  return useSpreadsheetLayer([[106.069042627535, -11.4743592401899, 1E-8]], {
    name: "The Sun",
    color: "#ffff0a",
    markerSize: 10,
    markerType: "gaussian",
    raUnit: RAUnits.degrees,
    distanceUnit: AltUnits.parsecs,
  }).createLayer().then(layer => {
    if (!layer) {
      throw new Error("Failed to create sun layer");
    }
    layer.set_plotType(PlotTypes.gaussian);
    layer.set_opacity(1);
    layer.set_markerScale(MarkerScales.screen);
    store.applyTableLayerSettings({
      id: layer.id.toString(),
      settings: [
        ["color", Color.load('#ffff0a')],
        ["scaleFactor", 100]
      ]
    });
    return layer;
  });
}

const sunLayer = ref<SpreadSheetLayer | null>(null);
onMounted(() => {
  // boiler plate to disable WWT and let warning be
  // shown to user if WebGL2 is not supported.
  if (webglDisabled.value) {
    showSplashScreen.value = false;
    // eslint-disable-next-lint @typescript-eslint/ban-ts-comment
    // @ts-expect-error `canvas` is defined
    WWTControl.singleton.canvas.setAttribute("hidden", "true");
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    WWTControl.singleton.renderOneFrame = function() {};
    return;
  }


  store.waitForReady().then(async () => {
    // keeping it in RA/Dec for convenience. Easier to check if point are in view and to go to a matching 3D view
    store.applySetting(["galacticMode", true]); /* moves might be wierd, but convenient coord sys */
    store.applySetting(["solarSystemCosmos", false]);
    skyBackgroundImagesets.forEach(iset => backgroundImagesets.push(iset));
    console.log("WWT engine ready, background imagesets:", backgroundImagesets);
    // get the Hipparcos catalog to start loading
    store.setBackgroundImageByName("Solar System");
    await new Promise(resolve => setTimeout(resolve, 350)); // 250 - 500ms is about long enough to wait for Hipparcos to load so later swtich is quicker
    store.setBackgroundImageByName('GAIA DR2'); // look at the Imagery list on the WWT page to see a list of background names
    WWTControl.singleton.setSolarSystemMinZoom(15000 * 9 / 4);  // min zoom for showing the solar system.

    // wait for spreadhseet to load
    await almagalSpreadsheetLayer.createLayer().then(layer => {
      const colorCol = almagalSpreadsheetLayer.getColumnIndex("color");
      if (layer && colorCol) {
        layer.set_colorMapColumn(colorCol);
      }
        
    });
    almagalSpreadsheetLayer.applyFilter();
    sourcesInView.setup();
    /*
     * The order in which image layers are loaded is important as they will stack.
     * awaiting makes sure the imageset layers are registered before moving on.
     */
    // wait for glimpse backgrund to load
    glimpse.load();
    await glimpse.ready;

    // //
    herschel.load();
    await herschel.ready.then(() => {
      herschel.hide();
    });

    // comparison images go above the background surveys but below ALMAGAL
    comparisons.load();
    await comparisons.ready;

    // wait for almagal toasted wtml to load, so that it is on top
    almagalWtml.load();
    await almagalWtml.ready;

    createSunLayer().then((layer) => {
      layer.set_enabled(false); // start with sun layer disabled, as it is just a reference point for the galactic center and can be distracting
      sunLayer.value = layer;
      console.log("Sun layer created");
    });

    // after that, we are ready to load
    layersLoaded.value = true;
    positionSet.value = true;
  });
});

function view3dFromGlonGlatDistkpc(glon: number, glat: number, dist_kpc: number) {
  const [ra, dec] = Coordinates.galactictoJ2000(glon, glat);
  // convert kpc to aU
  const distAu = dist_kpc * 1000 * 206265;

  return store.gotoRADecZoom({
    raRad: ra * D2R,
    decRad: dec * D2R,
    zoomDeg: distAu, // just go without zooming
    rollRad: store.rollRad,
    instant: false,
    duration: 2.5,
  });
}

/* singleton wwt 3d controller */
import { useWwt3dControl } from "./composables/wwt3dControl";
const { in3D: in3dView, switchTo2D } = useWwt3dControl(store);

watch(in3dView, (in3d) => {
  sunLayer.value?.set_enabled(in3d);
});

/* The tour's steps all set up 2D sky views, so opening it has to leave 3D. */
watch(showTour, (open) => {
  if (open && in3dView.value) {
    switchTo2D();
  }
});

let first3dswap = false;
function setup3DView() {
  if (!first3dswap) {
    return;
  }
  // the swtich has already set the initial view and mode, now we want to zoom out and above the galactic plane
  store.gotoRADecZoom({
    raRad: -(store.raRad + Math.PI / 2),
    decRad: -(store.decRad + 23.5 * D2R), // tilt up by 23.5 degrees to get above the galactic plane
    zoomDeg: 8 * 1000 * 206265,
    rollRad: 62.9 * Math.PI / 180,
    instant: false,
    duration: 4,
  }).then(() => {
    const [glon, glat] = Coordinates.j2000toGalactic(store.raRad / D2R, store.decRad / D2R);
    console.log("Current glon, glat:", glon, glat);
    view3dFromGlonGlatDistkpc(glon - 20 ,  glat + 30, 8).then(() => {
      store.gotoRADecZoom({
        raRad: store.raRad,
        decRad: store.decRad,
        zoomDeg: 16 * 1000 * 206265,
        rollRad: store.rollRad,
        instant: false,
        duration: 1,
      });
    });
  });
  first3dswap = false;
}


// Human-readable labels for the filter sliders above.
const filterFieldLabels: Record<FilterField, string> = {
  mass: "Mass (M<sub>⊙</sub>)",
  lum: "Luminosity (L<sub>⊙</sub>)",
  lm: "Lum. / Mass (L<sub>⊙</sub>/M<sub>⊙</sub>)",
  tdust: "Dust Temp. (K)",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "dist_ag": "Distance (pc)",
  tbol: "Bol. Temp. (K)",
};

const  filterFieldUnits: Record<FilterField, string> = {
  mass: "M<sub>⊙</sub>",
  lum: "L<sub>⊙</sub>",
  lm: "L<sub>⊙</sub>/M<sub>⊙</sub>",
  tdust: "K",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "dist_ag": "pc",
  tbol: "K",
};

// the filter function closes over a reactive, so this function changes as the filter spec changes.
almagalSpreadsheetLayer.setFilter(filterFunction);

//Re-apply filter whenever the spec changes. does nothing if layer doesn't exist
watch(filterSpec, () => almagalSpreadsheetLayer.applyFilter(), { deep: true });
watch(clumpTypeFilter, () => almagalSpreadsheetLayer.applyFilter(), { deep: true });


watch(selectedAlmagalSource, (newSource, oldSource) => {
  if (newSource && !in3dView.value) {
    store.gotoRADecZoom({
      raRad: newSource.ra * D2R,
      decRad: newSource.dec * D2R,
      zoomDeg: store.zoomDeg, // just go without zooming
      rollRad: 0,
      instant: false,
    });
  }
  // picking a clump means the ALMAGAL blurb is not what is wanted
  if (newSource && infoSheetTab.value === ALMAGAL_TAB) {
    infoSheetTab.value = SOURCE_INFORMATION_TAB;
  }
});


const ready = computed(() => positionSet.value && layersLoaded.value);
/* `isLoading` is a bit redundant here, but it could potentially have independent logic */
const isLoading = computed(() => !ready.value);


const currentSource = computed(() => {
  return hoveredSource.value ?? selectedAlmagalSource.value;
});

/* This lets us inject component data into element CSS */
const cssVars = computed(() => {
  return {
    "--almagal-blue": almagalBlue.value,
    "--almagal-orange": almagalOrange.value,
    "--almagal-blue-darker": almagalBlueDarker.value,
    "--almagal-orange-darker": almagalOrangeDarker.value,
  };
});


/* Sync up the colormap, stretch, and vmin/vmax for all of the loaded fits images with the WTML as the source of truth */
const imagesetLayerStates = computed(() => {
  const states: ImageSetLayerState[] = [];
  almagalSourceLayers.value.forEach(layer => {
    const state = store.imagesetStateForLayer(layer.id.toString());
    if (state) {
      states.push(state);
    }
  });
  return states;
});
function updateImagesetLayerDisplaySettings() {
  for (let state of imagesetLayerStates.value) {
    setFitsLayerSettings(state.getGuid(), store, FITS_LAYER_SETTINGS);
  }
}
watch(() => almagalWtmlState.value ? almagalWtmlState.value.vmax : null, (newVmax, oldVmax) => {
  if (newVmax && newVmax !== oldVmax) {
    FITS_LAYER_SETTINGS.stretch.vmax = newVmax;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.vmin : null, (newVmin, oldVmin) => {
  if (newVmin && newVmin !== oldVmin) {
    FITS_LAYER_SETTINGS.stretch.vmin = newVmin;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.scaleType : null, (newScale, oldScale) => {
  if (newScale && newScale !== oldScale) {
    FITS_LAYER_SETTINGS.stretch.stretch = newScale;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.settings.colorMapperName : null, (newCmap, oldCmap) => {
  if (newCmap && newCmap !== oldCmap) {
    FITS_LAYER_SETTINGS.cmap = newCmap as Colormaps;
    updateImagesetLayerDisplaySettings();
  }
});
watch(() => almagalWtmlState.value ? almagalWtmlState.value.settings.opacity : null, (newOp, oldOp) => {
  if (newOp && newOp !== oldOp) {
    FITS_LAYER_SETTINGS.opacity = newOp;
    updateImagesetLayerDisplaySettings();
  }
});

</script>

<style lang="less">

// #app is a column flex container with two children:
// #main-content and #bottom-drawer.
// #main-content contains the WWT display and the overlay content.

#app {
  // Vuetify's root app element fills the viewport.
  overflow: hidden;
  // Vuetify's root app element is a column flex layout
  // lets #main-content take the remaining height
  // after `#bottom-drawer` takes its own height.
}

// while #app is a flex, the direct parent
// is .v-application__wrap
// this takes the size of its children
// so we need to apply height definitions here
// for a display with a side-panel this is generally
// what we want
// Scoped under #app so these beat Vuetify's own `.v-application__wrap` rule,
// which sets `flex-direction: column`. A bare `.v-application__wrap` selector
// only ties it on specificity and loses on source order, which left the panel
// stacked on top of the view at 34% width.
// Default is the column/bottom-panel layout; a side panel opts in.
#app > .v-application__wrap {
  flex-direction: column;
  max-height: 100svh;  // force the application to be 100%
}

#app.app-side-panel > .v-application__wrap {
  flex-direction: row;
  max-height: 100svh;  // force the application to be 100%
}


#main-content {
  // This is the containing block for the absolutely positioned WWT host and overlay.
  position: relative;
  display: block; // don't need to set width. block elements stretch to fill their container by default.
  // Its height is determined by the flex layout in `#app`.
  // Shrinkable with no min-size floor, so an open drawer takes its share
  // instead of pushing the view off the screen (SideDrawer.vue, note 3).
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  // default (column layout): view on top, panel below it
  order: 1;
  // transition: height 0.1s ease-in-out;
}

// side-panel layout: #side-drawer follows #main-content in the DOM, so flipping
// the order is what puts the panel on the left of the view
#app.app-side-panel {
  #main-content {
    order: 2;
  }

  #side-drawer {
    order: 1;
  }
}

/* OLD: overlay version. Taken out of flow with `position: absolute`, so it
   slid over #main-content and the WWT view never changed size.
<v-select
                      v-model="foregroundImage"
                      class="almagal-v-select"
                      :items="foregroundImageOptions"
                      item-title="label"
                      item-value="value"
                      hide-details
                      autofocus
                      label="Background survey"
                    />
#side-drawer {
  position: absolute;
  bottom: 0;
  z-index: 10;
  height: 100%;
  width: 0;
  width: 34vw;
  transform: translateX(-34vw);
  transition: all 0.3s ease-in-out;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;

  &.side-drawer-open {
    transform: translateX(0);
  }
}

#side-drawer.info-bottom {
  left: 0;
  width: 100%;
  height: 0;
  transition: height 0.3s ease-in-out;
  transform: none;
  border-top-left-radius: 5px;
  border-bottom-right-radius: 0;

  &.side-drawer-open {
    height: 34vh;
  }
}
*/

// NEW: in-flow flex sibling of #main-content, so opening it shrinks the WWT
// view instead of covering it (same idea as artemis-ii / why-roman).
// Default is the bottom panel: full width, growing in height.
#side-drawer {
  flex: 0 0 auto;
  overflow: hidden;
  order: 2;
  width: 100%;
  height: 0;
  // transition: height 0.3s ease-in-out;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;

  &.side-drawer-open {
    height: 34%;
  }
}

// side panel: full height, growing in width
#app.app-side-panel #side-drawer {
  width: 0;
  height: 100%;
  // transition: width 0.3s ease-in-out;
  border-top-left-radius: 0;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;

  &.side-drawer-open {
    width: 34%;
  }
}


/* SideDrawer sizes its own box; where it sits and what it looks like are ours.
   Stacked, its own `order: 1` would put it above the view. */
#tour-drawer.drawer-bottom {
  order: 2;
}

#tour-drawer .tour-sheet {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 1em 1.25em;
  color: #e6e6e6;
  background-color: var(--almagal-blue-darker);
}

/* Teleported into #bottom-content, so it is an ordinary flex item in the
   overlay's bottom row rather than a box pinned to the corner. Undo the
   absolute positioning SideDrawer gives this layout -- the row places it now,
   and the control bar flows beside it instead of being padded past it. The
   overlay is pointer-events: none, so the drawer has to opt back in. */
#tour-drawer.drawer-float {
  position: relative;
  inset: auto;
  border-radius: 5px;
  box-shadow: 0 0 1rem #000a;
  pointer-events: auto;
}

#tour-drawer.drawer-float .tour-sheet {
  border-radius: 5px;
}

#tour-drawer.drawer-push .tour-sheet {
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

#tour-drawer.drawer-bottom .tour-sheet {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.tour-sheet-close {
  position: absolute;
  top: 0.25em;
  right: 0.25em;
  color: white;
}

/* The WWT host is out of flow so its measured size does not affect #main-content. */
// by using inset: 0, .wwttelescope-component fills #main-content and automatically resizes with it,
// without needing a height width set. this allows main-content to be more freely sizes.
/*
WWT can size itself from CSS alone here because #main-content has a real layout size (from the flex layout in #app)
and `.wwtelescope-component` is absolutely positioned to fill it.

This breaks if #main-content stops having a definite size from layout. Common failure modes:
  - `#main-content` loses `flex-grow`/flex sizing, so in a column layout it can collapse to zero height.
  - An ancestor no longer has a definite height, so percentage or flex-based heights stop resolving.
  - `#main-content` is changed to content-sized sizing (`auto`, `fit-content`, certain grid/flex min-content cases),
    so its size starts depending on descendants instead of the outer layout.
  - `.wwtelescope-component` is put back in normal flow, letting WWT's continuously resized canvas feed back into layout
    and recreate the growth loop.
  - Padding or other box-model changes are applied to the measured WWT host instead of an outer wrapper, which can
    reintroduce resize feedback.

If any of those happen, the ResizeObserver composable may be needed again to push the resolved size from
`#main-content` onto the WWT host explicitly.
*/
.wwtelescope-component {
  position: absolute; // putting this to relative will cause the growth loop, and will require the composable to prevent that
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  // The composable sets the host element's inline width/height from #main-content.
  // transition: height 0.2s ease-in-out;
  opacity: 1;
}

/*
#wwt-overlay is positioned against #main-content, not the viewport.
`position: absolute` makes it fill #main-content.
`position: fixed` would anchor it to the viewport instead.
The overlay itself is out of flow, but its children can use normal flex layout inside it.
you can also do position: relative, height: 100%. (and remove the inset: 0)
- absolute + inset: 0 says “this is a layer pinned to the container”
- relative + height: 100% says “this is a normal child trying to be as tall as its parent”
we use the absolute variant to stay more independent of the which can interact weirdly with WWT's resizing.
and the relative still requires the parent to have a definite size.
and remember, position:absolute is still a positioned parent, so children can be absolute against it
*/
#wwt-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 1rem;
  pointer-events: none;

  display: flex;
  flex-direction: column;
  justify-content: space-between; // pushes top and bottom content apart
}

#wwt-overlay > * {
  // give all direct children their own stacking context, so they layer in order
  isolation: isolate;
}

#app.app-is-landscape {
  .v-application__wrap {
    flex-direction: row;
    height: 100svh;
    max-height: 100svh;
  }

  #main-content {
    flex: 1 1 0;
    min-width: 0;
  }
}

#top-content {
  width: 100%; // 100% of the overlay less the padding
  pointer-events: none;
  display: flex;
  flex-direction: row; // stack top-buttons-row and second-buttons-row vertically
  justify-content: space-between; // keeps left, center, and right buttons spread
  align-items: flex-start;
}

#left-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 5px;
}

.top-buttons-row,
.second-buttons-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 10px;
}

#center-buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  pointer-events: auto;
  width: 300px;
}
#right-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
  height: auto;

  hr {
    margin-block: 0.25em;
    opacity: 0;
  }
}

.icon-wrapper {
    pointer-events: auto !important;
    background-color: transparent !important;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }


// two rows: the tour-and-controls row, then the logos
#bottom-content {
  display: grid;
  grid-template-columns: auto;
  grid-template-rows: auto auto;
  gap: 0.5em;
  pointer-events: none;
  align-items: flex-end;
}

#bottom-content {
  // the floating tour and the control bar share this row, bottom-aligned
  .bottom-main {
    display: flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 1rem;
    min-width: 0;
  }

  // `contents` so the empty slot takes no room, and the teleported drawer
  // becomes a flex item of .bottom-main directly
  #tour-float-slot {
    display: contents;
  }

  #body-logos {
    align-self: flex-end;
  }

  #body-logos.small-logos {
    display: none;
    margin-top: 0.5em;
  }

  #icons-container {
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  }

  .toolkit-credit {
    font-size: 0.65rem;
    color: rgba(255,255,255,0.55);
    text-align: right;
    margin: 2px 0 0;
    a { color: inherit; text-decoration: underline; }
  }
}

#app.app-is-small #bottom-content {
  padding: 0;
}

// From Sara Soueidan (https://www.sarasoueidan.com/blog/focus-indicators/) & Erik Kroes (https://www.erikkroes.nl/blog/the-universal-focus-state/)
// :not won't work on some browseers, but avoids a complicated set of css
:focus-visible:not(.v-btn):not(.v-field):not(.v-input) {
  outline: 4px double white;
  box-shadow: 0 0 0 2px black;
  border-radius: .025rem;
}

.v-field__input > input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}

.layout-debug {
  #main-content {
    border: 2px solid red;
  }
  #main-content,
  #top-content,
  #left-buttons,
  #center-buttons,
  #right-buttons,
  .top-buttons-row,
  .second-buttons-row,
  #bottom-content {
    outline: 1px solid white;
    min-width: 1px;
    min-height: 1px;
  }
  #wwt-overlay {
    border: 3px solid aqua;
  }

}

#bottom-drawer {
  position: relative;
  overflow: auto;
}

.v-btn {
  pointer-events: auto;
}

.blur-background {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(6px);
}

.white-outline {
  border: 1px solid white;
}

.source-controls {
  display: flex;
  align-items: start;
  justify-content: center;
  gap: 8px;
}


.main-logo-text {
  text-align: center;
  width:fit-content;
}

.v-btn.blur-button.v-btn--variant-outlined {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(6px);
}

.layer-list {
  outline: 1px solid black;
  border: 1px solid white;
  padding: 4px;
  border-radius: 4px;
}

.layer-list__item {
  background-color: rgba(0, 0, 0, 0.364);
  border: 1px solid rgba(255, 255, 255, 0.541);
  border-radius: 5px;
  backdrop-filter: blur(10px);
  width: 100%;
}

.on-canvas {
  background-color: rgba(0, 0, 0, 0.364);
  border: 1px solid rgba(255, 255, 255, 0.541);
  border-radius: 5px;
  backdrop-filter: blur(10px);
}

.almagal-v-select {
  pointer-events: auto;
  border-radius: 4px;
  min-width: 250px;
}

.hovered-source-info {
  background-color: rgba(0, 0, 0, 0.364);
  backdrop-filter: blur(10px);
  width: fit-content;
  min-height: 50px;
  padding: 0.5em 1em;
  border-radius: 8px;
}


// One narrow column by default: a 230px panel hides far less sky than a 470px
// one, and a clear view is worth more than a short panel wherever there is
// height to spend. `minmax(0, 1fr)` rather than `1fr`: the sliders' own
// min-content is wide enough to blow the column past its share otherwise.
.almagal-filterset {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.5em 1.25em;
  border-radius: 8px;
  font-size: 0.9em;
  padding-bottom: 1em;
  padding-right: 1em;
  border: none; // browser has a default border on fieldsets
  
}

.filter-slider label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.fiducial-display {
  background-color: #c7d8fd;
  min-width: 50px;
  margin-left: auto;
  text-align: right;
  color: black;
  padding-inline: 4px;
  border-radius: 3px;
}

// The divider and the clump-type block are not sliders: they run across both
// columns. Longhands on purpose -- this stylesheet is Less, which compiles the
// shorthand `grid-column: 1 / -1` to `grid-column: -1` (it reads the slash as
// division), which silently adds a third column and scrambles the sliders.
.almagal-filterset > hr,
.almagal-filterset > .clump-type-filter {
  grid-column-start: 1;
  grid-column-end: -1;
}

// style the legend to be centerd
.almagal-filterset > legend {
  margin-inline: auto;
  padding: 0 5px;
}

.almagal-filterset label > span {
  font-weight: bold;
}

.almagal-filterset > .clump-type-filter {
  margin: 0.5em;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.clump-type-filter > span {
  font-weight: bold;
}
// 100px gives two across in the narrow one-column panel; the two-column
// media query above raises it so the five types do not break 4 + a stray one
.clump-type-filter > .clump-type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.25em;
}

.pending-source-label {
  color: white;
  font-size: 0.85em;
  padding: 4px 8px;
  font-weight: bold;
}

.bunch-o-buttons {
  max-width: 300px;
}

// takes whatever the tour leaves, and centres its buttons in that
#bottom-content .control-bar {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  gap: 0.75em;
  padding-inline: 0.5em;
}

.v-field__outline {
  // --v-field-border-width: 1px !important;
  // --v-field-border-opacity: 1 !important;
}



.learn-more-card {
  
  flex-direction: row;
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.5em 0.75em;
  
  text-align: left;
  font-size: 0.95em;
  font-weight: bold;

  backdrop-filter: blur(10px);
  background-color: rgba(0, 0, 0, 0.364);
  
  border: 1px solid white;
  border-radius: 8px;
  cursor: pointer;
  
  width: fit-content;
  max-width: 250px;
  pointer-events: auto;

}

.learn-more-text {
  flex: 1;
}

.learn-more-logo {
  height: 2.75em;
  width: auto;
  border-radius: 4px;
}

/* the comparison controls, now inside the info sheet's Settings tab rather
   than spread across the bottom of the view */
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 0.75em;
  max-width: 420px;
}

.settings-hint {
  font-size: 0.9em;
  opacity: 0.8;
}

.settings-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.25em;
}

.settings-description {
  font-size: 0.9em;
  border-left: 2px solid var(--almagal-blue);
  padding-left: 0.75em;
}

// adjust the wwt-3d switch 
.wwt-3d-swtich-container .v-input.v-switch > .v-input__prepend {
  margin-right: 4px;
  font-size: 20px;
}
.wwt-3d-swtich-container .v-input.v-switch > .v-input__append {
  margin-left: 4px;
  font-size: 20px;
}
</style>
