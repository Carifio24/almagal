<template>
  <div class="wwt-3d-swtich-container">
    <slot 
      :in-3d="in3D"
      :on-click="toggle3d"
    >
      <v-btn
        variant="flat"
        @click="in3D = !in3D"
      >
        {{ in3D ? "Switch to 2D" : "Switch to 3D" }}
      </v-btn>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { engineStore } from '@wwtelescope/engine-pinia';
import { useWwt3dControl } from "../composables/wwt3dControl";

const store = engineStore();
const emits = defineEmits(['3d', '2d']);

/* The app-wide control -- the parent reads the same `in3D`, so there is no
   local copy of the state to keep in sync. */
const { in3D, toggle3d } = useWwt3dControl(store, {
  on3d: () => emits('3d'),
  on2d: () => emits('2d'),
});
</script>

<style>
.wwt-3d-swtich-container {
  pointer-events: auto;
}
</style>
