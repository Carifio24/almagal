<!-- The step controls from why-roman's TourSheet: Back, a row of dots, Next.
     Steps are 1-indexed. Back and Next come with buttons, but both are slots. -->
<template>
  <div class="tour-text-controls">
    <slot
      name="back"
      :disabled="disablePrevious"
      :hidden="backHidden"
      :text="backText"
      :on-click="() => emit('previous')"
    >
      <v-btn
        :class="{
          'tour-button-hidden': backHidden, // hides but keeps the space
          'tour-button-display-none': backHidden && removeHiddenButtons,
          'px-2': smallSize,
          'mr-1': smallSize,
        }"
        variant="flat"
        :density="smallSize ? 'compact' : 'default'"
        :disabled="disablePrevious"
        @click="emit('previous')"
      >
        {{ backText }}
      </v-btn>
    </slot>

    <!-- divider="" is provided down to the dividers, so they just space the dots -->
    <v-breadcrumbs
      v-if="showBreadcrumbs"
      class="tour-dots"
      divider=""
    >
      <template
        v-for="n in totalSteps"
        :key="n"
      >
        <v-breadcrumbs-divider v-if="n > 1" />
        <!-- no :disabled - on VBreadcrumbsItem that is pointer-events: none -->
        <v-breadcrumbs-item>
          <slot
            :index="n - 1"
            :step="n"
            :active="n === step"
          >
            <button
              class="tour-dot"
              :class="{ 'tour-dot-active': n === step }"
              :aria-label="`Go to step ${n}`"
              @click="() => emit('step', n)"
            >
              ⬤
            </button>
          </slot>
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
    <v-spacer v-else />

    <slot
      name="next"
      :disabled="disableNext"
      :hidden="nextHidden"
      :text="nextText"
      :on-click="() => emit('next')"
    >
      <v-btn
        :class="{
          'tour-button-hidden': nextHidden, // hides but keeps the space
          'tour-button-display-none': nextHidden && removeHiddenButtons,
          'px-2': smallSize,
          'ml-1': smallSize
        }"
        variant="flat"
        :density="smallSize ? 'compact' : 'default'"
        :disabled="disableNext"
        @click="emit('next')"
      >
        {{ nextText }}
      </v-btn>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  /** 1-indexed, like the rest of the tour */
  step: number,
  totalSteps: number,
  smallSize?: boolean,
  /** the step dots */
  showBreadcrumbs?: boolean,
  showNextOnLastStep?: boolean,
  showBackOnFirstStep?: boolean,
  nextText?: string,
  backText?: string,
  disableNext?: boolean,
  disablePrevious?: boolean,
  /** take a hidden button out of the layout entirely, rather than leaving its space */
  removeHiddenButtons?: boolean,
}

const props = withDefaults(defineProps<Props>(), {
  smallSize: false,
  showBreadcrumbs: true,
  showNextOnLastStep: false,
  showBackOnFirstStep: false,
  nextText: 'Next',
  backText: 'Back',
  disableNext: false,
  disablePrevious: false,
  removeHiddenButtons: false,
});

const emit = defineEmits<{
  (e: 'previous' | 'next'): void;
  (e: 'step', step: number): void;
}>();

/* Hidden rather than dropped, so the dots stay put at either end. */
const backHidden = computed(() => props.step === 1 && !props.showBackOnFirstStep);
const nextHidden = computed(() => props.step === props.totalSteps && !props.showNextOnLastStep);
</script>

<style lang="less">
.tour-text-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: 0.5rem;

  // Scoped to .tour-text-controls, so it catches Back/Next without
  // touching the breadcrumb dots or the buttons a caller puts in
  // the slots.
  .v-btn {
    border: 1px solid var(--almagal-orange);
    background-color: var(--almagal-orange);
    color: white;
  }

  .tour-button-hidden {
    visibility: hidden;
    pointer-events: none;

    // the modifier: gives up the space too, so the row closes around it
    &.tour-button-display-none {
      display: none;
    }
  }

  .tour-dots {
    flex: 1 1 0;
    min-width: 0;
    max-width: 14rem;
    margin: 0 auto;
    justify-content: space-evenly;
    padding: 0;

    .v-breadcrumbs-item {
      padding: 0 1px;
    }

    // divider="" still renders the divider items, and their padding is what
    // made the row too wide to fit
    .v-breadcrumbs-divider {
      padding: 0 2px;
    }

    button.tour-dot {
      padding: 0;
      --tour-dot-size: 0.5rem;
      font-size: var(--tour-dot-size);
      line-height: 1;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
    }

    button.tour-dot-active {
      color: var(--almagal-orange);
      --font-delta: 0.25em;
      font-size: calc(var(--tour-dot-size) + var(--font-delta));
      margin: calc(-1*var(--font-delta));
      z-index: 10;
    }
  }
}
</style>
