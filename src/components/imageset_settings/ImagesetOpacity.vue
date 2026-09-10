<template>
  <div
    class="detail-row"
  >
    <span class="prompt">Opacity:</span>
    <v-slider
      v-model="twoWayOpacity"
      class="scrubber"
      :max="1"
      :min="0"
      :step="0.01"
      hide-details
    ></v-slider>
  </div>
</template>

<script setup lang="ts">
import { ImageSetLayerSetting } from "@wwtelescope/engine";
import {
  ImageSetLayerState,
  engineStore,
} from "@wwtelescope/engine-pinia";

import { computed } from "vue";



const props = defineProps<{
  imageset: ImageSetLayerState;
}>();

const store = engineStore();
 

const twoWayOpacity = computed({
  get(): number {
    return props.imageset.settings.opacity;
  },
  set(v: number) {
    applySettings([["opacity", v]]);
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
  padding-right: 8px;
}
.detail-row {
  cursor: pointer;
}

.scrubber {
  flex: 1;
  cursor: pointer;
}

</style>
