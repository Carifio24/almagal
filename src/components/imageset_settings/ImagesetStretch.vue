<!-- The three stretch controls together: the scale type, and the low/high
     cutoffs that it is applied between. They share `stretchFitsLayer`, which
     takes all three at once, so splitting them further would mean each one
     reading the other two back off the layer anyway. -->
<template>
  <div class="stretch-container">
    <div
      v-if="!hideStretch"
      class="detail-row"
    >
      <slot 
        name="stretch"
        :on="{
          modelValue: twoWayScaleType,
          'onUpdate:modelValue': (v: ScaleTypes) => {
            twoWayScaleType = v;
          }
        }"
        :scaletypes="uiScaleTypes"
      >
        <span class="prompt">Stretch:</span><select v-model="twoWayScaleType">
          <option
            v-for="x in uiScaleTypes"
            :key="x.desc"
            :value="x.wwt"
          >
            {{ x.desc }}
          </option>
        </select>
      </slot>
    </div>

    <div
      v-if="!hideVrange && !hideVmin"
      class="detail-row"
    > 
      <slot 
        name="vmin"
        :on="{
          modelValue: twoWayVMin,
          'onUpdate:modelValue': (v: number) => {
            twoWayVMin = v;
          }
        }"
      >
        <span class="prompt cutoff">Low:</span>
        <input
          v-model.lazy="twoWayVMinText"
          type="text"
          class="cutoff-input"
        />
        <component
          :is="logStretchSlider ? 'v-log-slider' : 'v-slider'"
          v-model="twoWayVMin"
          class="scrubber"
          :min="fitsDataMin"
          :max="fitsDataMax"
          :step="cutoffStep"
          hide-details
        ></component>
      </slot>
    </div>

    <div
      v-if="!hideVrange && !hideVmax"
      class="detail-row"
    >
      <span class="prompt cutoff">High:</span>
      <input
        v-model.lazy="twoWayVMaxText"
        type="text"
        class="cutoff-input"
      />
      <component
        :is="logStretchSlider ? 'v-log-slider' : 'v-slider'"
        v-model="twoWayVMax"
        class="scrubber"
        :min="fitsDataMin"
        :max="fitsDataMax"
        :step="cutoffStep"
        hide-details
      ></component>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ScaleTypes } from "@wwtelescope/engine-types";
import {
  StretchFitsLayerOptions,
} from "@wwtelescope/engine-helpers";
import {
  ImageSetLayerState,
  engineStore,
} from "@wwtelescope/engine-pinia";

import { computed } from "vue";


interface UiScaleTypes {
  wwt: ScaleTypes;
  desc: string;
}

const uiScaleTypes: UiScaleTypes[] = [
  { wwt: ScaleTypes.linear, desc: "Linear" },
  { wwt: ScaleTypes.log, desc: "Logarithmic" },
  { wwt: ScaleTypes.squareRoot, desc: "Square Root" },
  { wwt: ScaleTypes.power, desc: "Exponential" },

  // Not fully implemented ... I think ...?
  //{ wwt: ScaleTypes.histogramEqualization, desc: "Hist-Eq" },
];

const props = defineProps<{
  imageset: ImageSetLayerState;
  /* The slider ends. Without one, the FITS layer's own measured data range. */
  crange?: { min: number; max: number };
  logStretchSlider?: boolean;
  /* Which of the three rows to leave out. `hideVrange` covers both cutoffs;
     `hideVmin`/`hideVmax` drop one of them. */
  hideStretch?: boolean;
  hideVrange?: boolean;
  hideVmin?: boolean;
  hideVmax?: boolean;
}>();

const store = engineStore();


const twoWayScaleType = computed({
  get(): ScaleTypes {
    return props.imageset.scaleType;
  },
  set(v: ScaleTypes) {
    const o: StretchFitsLayerOptions = {
      id: props.imageset.getGuid(),
      vmin: props.imageset.vmin,
      vmax: props.imageset.vmax,
      stretch: v,
    };

    store.stretchFitsLayer(o);
  }
});

const twoWayVMax = computed({
  get(): number {
    return props.imageset.vmax;
  },
  set(v: number) {
    const o: StretchFitsLayerOptions = {
      id: props.imageset.getGuid(),
      vmin: props.imageset.vmin,
      vmax: v,
      stretch: props.imageset.scaleType,
    };

    store.stretchFitsLayer(o);
  }
});

const fitsDataMin = computed((): number => {
  if (props.crange) {
    return props.crange.min;
  }
  const imgset = store.imagesetForLayer(props.imageset.getGuid());
  return imgset?.get_fitsProperties().minVal ?? 0;
});

const fitsDataMax = computed((): number => {
  if (props.crange) {
    return props.crange.max;
  }
  const imgset = store.imagesetForLayer(props.imageset.getGuid());
  return imgset?.get_fitsProperties().maxVal ?? 1;
});

const cutoffStep = computed((): number => {
  return (fitsDataMax.value - fitsDataMin.value) / 1000;
});

const twoWayVMaxText = computed({
  get(): string {
    return "" + twoWayVMax.value;
  },
  set(v: string) {
    const n = Number(v);

    if (isFinite(n)) {
      twoWayVMax.value = n;
    }
  }
});

const twoWayVMin = computed({
  get(): number {
    return props.imageset.vmin;
  },
  set(v: number) {
    const o: StretchFitsLayerOptions = {
      id: props.imageset.getGuid(),
      vmin: v,
      vmax: props.imageset.vmax,
      stretch: props.imageset.scaleType,
    };

    store.stretchFitsLayer(o);
  }
});

const twoWayVMinText = computed({
  get(): string {
    return "" + twoWayVMin.value;
  },
  set(v: string) {
    const n = Number(v);

    if (isFinite(n)) {
      twoWayVMin.value = n;
    }
  }
});

</script>

<style scoped lang="less">

.stretch-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  padding: 1px 0px;

  // Get nice vertical alignment in individual rows
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: flex-start;
  user-select: none;
  flex: 1 1 auto;
}

.prompt {
  font-size: 11pt;
  font-weight: bold;
  padding-right: 5px;
}

select {
  width: 70%;
  max-width: fit-content;
}

.detail-row > select {
  cursor: pointer;
}

.scrubber {
  flex: 1;
  cursor: pointer;
}

.cutoff {
  width: 40px;
  padding-right: 0px;
  flex-shrink: 0;
}

.cutoff-input {
  width: 60px;
  flex-shrink: 0;
  text-align: center;
}

</style>
