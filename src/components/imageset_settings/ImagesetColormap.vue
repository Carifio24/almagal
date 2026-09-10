<template>
  <div
    class="detail-row"
  >
    <slot 
      :on="{
        modelValue: twoWayColorMapperName,
        'onUpdate:modelValue': (v: string) => {
          twoWayColorMapperName = v;
        }
      }"
      :colormaps="uiColorMaps"
    >
      <span class="prompt">Colormap:</span><select v-model="twoWayColorMapperName">
        <option
          v-for="x in uiColorMaps"
          :key="x.desc"
          :value="x.wwt"
        >
          {{ x.desc }}
        </option>
      </select>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { ImageSetLayerSetting } from "@wwtelescope/engine";
import {
  ImageSetLayerState,
  engineStore,
} from "@wwtelescope/engine-pinia";

import { computed } from "vue";


interface UiColorMaps {
  wwt: string;
  desc: string;
}

const uiColorMaps: UiColorMaps[] = [
  { wwt: "viridis", desc: "Viridis" },
  { wwt: "plasma", desc: "Plasma" },
  { wwt: "inferno", desc: "Inferno" },
  { wwt: "magma", desc: "Magma" },
  { wwt: "cividis", desc: "Cividis" },
  { wwt: "rdylbu", desc: "Thermal (Red-Yellow-Blue)" },
  { wwt: "gray", desc: "Black-to-White" },
  { wwt: "greys", desc: "White-to-Black" },
  { wwt: "purples", desc: "White-to-Purple" },
  { wwt: "blues", desc: "White-to-Blue" },
  { wwt: "greens", desc: "White-to-Green" },
  { wwt: "oranges", desc: "White-to-Orange" },
  { wwt: "reds", desc: "White-to-Red" },
  { wwt: "rdbu", desc: "Red-to-Blue" },
];

const props = defineProps<{
  imageset: ImageSetLayerState;
}>();

const store = engineStore();


const twoWayColorMapperName = computed({
  get(): string {
    return props.imageset.settings.colorMapperName;
  },
  set(v: string) {
    applySettings([["colorMapperName", v]]);
  }
});


function applySettings(settings: ImageSetLayerSetting[]) {
  store.applyFitsLayerSettings({
    id: props.imageset.getGuid(),
    settings: settings,
  });
}

</script>

<style scoped lang="less">

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

</style>
