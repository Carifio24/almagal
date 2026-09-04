<!-- eslint-disable vue/max-attributes-per-line -->
<template>
  <v-card class="info-sheet" height="100%">
    <!-- Vuetify gives the unselected tab tabindex="-1" (the ARIA roving-tabindex
         pattern, where arrow keys move between tabs) but its own arrow handling
         does not fire here, leaving that tab unreachable by keyboard. Drive it
         ourselves. -->
    <v-tabs
      v-if="!hideTabs"
      v-model="tab"
      class="info-sheet-tabs"
      :color="tabColor"
      :slider-color="tabColor"
      density="compact"
      align-tabs="end"
      @keydown.left.prevent="cycleTab(-1)"
      @keydown.right.prevent="cycleTab(1)"
    >
      <!-- tabindex="0" on every tab, not just the selected one: Vuetify's
           default is the roving-tabindex pattern, where Tab reaches the bar and
           arrows move within it. With two tabs that just reads as "the second
           one is unreachable", so make both Tab stops. Arrow keys still work. -->
      <v-tab 
        v-for="_tabName in tabs" 
        :key="_tabName"
        class="info-sheet-tab" 
        tabindex="0"
      >
        <h3>{{ _tabName }}</h3>
      </v-tab>
    </v-tabs>
    <v-icon
      id="close-text-icon"
      class="control-icon"
      size="large"
      icon="mdi-close"
      tabindex="0"
      @click="handleClose"
      @keyup.enter="handleClose"
    >
    </v-icon>

    <!-- Information Content -->
    <v-window id="tab-items" v-model="tab" class="pb-2" :style="cssVars">
      <slot />
    </v-window>
  </v-card>
</template>

<script lang="ts">

import type { InjectionKey, Ref } from "vue";
export const injectionKey = Symbol("vTabs") as InjectionKey<{
    withinTabs: boolean;
    registerTab: (title: string) => number;
    activeTab: Readonly<Ref<number | undefined>>;
    activateTab: (index: number) => void;
  }>;
  
export interface Props {
  tabColor: string,
  textColor?: string,
  headingColor?: string,
  accentColor?: string,
  tabTitle?: string,
  hideUserGuide?: boolean,
  hideTabs?: boolean,
}
</script>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import{ provide, readonly } from 'vue';


const emit = defineEmits(['close', 'update:tabName']);

function handleClose() {
  showTextSheet.value = false;
  emit('close');
}

const showTextSheet = defineModel<boolean>();


// adapted from https://vueschool.io/articles/vuejs-tutorials/tightly-coupled-components-vue-components-with-provide-inject/
const tabs = ref<string[]>([]);
// const tab = ref(0);
const tab = defineModel<number>('tab', {default: 0});
const tabName = defineModel<string>('tabName', {default: ''});
let firstRun: boolean = true;
// initialize the tabName to whatever tab is
watch(tab, (newTab) => {
  if (firstRun) {
    tabName.value = tabs.value[newTab];
    firstRun = false;
  }
});


watch(tab, (newTab) => {
  tabName.value = tabs.value[newTab];
});
watch(tabName, (newTabName) => {
  const index = tabs.value.indexOf(newTabName);
  if (index !== -1) {
    tab.value = index;
    return;
  }
  console.warn(`tabName ${newTabName} not found in tabs: ${tabs.value}`);
});



// This function will allow the child `vTabPanels` to register their title
// with the parent `vTabs`
// Again it's a function because of the reasoning above.
function registerTab(title: string) {
  const existing = tabs.value.indexOf(title);
  if (existing !== -1) return existing;
  tabs.value.push(title);
  return tabs.value.length - 1;
}

function activateTab(index: number) {
  tab.value = index;
}

// left/right through the tabs, wrapping, then move focus to the new one so the
// keyboard user can see where they are
function cycleTab(delta: number) {
  const count = tabs.value.length;
  if (count < 2) {
    return;
  }
  tab.value = (tab.value + delta + count) % count;
  nextTick(() => {
    const selected = document.querySelector<HTMLElement>(".info-sheet-tab.v-tab--selected");
    selected?.focus();
  });
}

// This is where the magic happens.
// The provide function exposes the data to the child
// The injection key is a unique identifier so that we can
// "pickup" the data in the child using the same key
provide(injectionKey, {
  // This is just a good way for us to check in the child that the `vTabPanel`
  // was correctly used in the context of the `vTabs` component
  withinTabs: true,

  // We expose the 2 functions defined above to the child
  registerTab,
  activateTab,

  // We expose the active tab to the child
  // but notice we use readonly to keep the child from directly mutating it
  activeTab: readonly(tab),
});








const props = defineProps<Props>();

watch(() => props.hideUserGuide, (hidden) => {
  if (hidden) tab.value = 0;
});

const cssVars = computed(() => {
  return {
    '--info-sheet-text-color': props.textColor ?? '#ffffff',
    '--info-sheet-heading-color': props.headingColor ?? props.textColor,
    '--info-sheet-accent-color': props.accentColor ?? props.tabColor,

  };
});




</script>


<style lang="less">
// NB: these styles aren't scoped, and nothing in here uses .intro-card, so this
// rule only lands on consumers
.intro-card {
  padding: 1em;
}

// the tab class is `info-sheet-tab` here; why-roman's copy of this file still
// names the older `.info-tabs`, so the h3 inside each tab lost its size and
// fell back to the UA default of 1.17em bold
.info-sheet-tab h3 {
  font-size: 0.9em;
}

.info-text {
  display: flex !important;
  flex-direction: column;
  color: var(--info-sheet-text-color);

  a {
    color: currentColor;
    text-decoration-style: dotted;
  }

  h3 {
    font-size: 1.4em;
    color: var(--info-sheet-heading-color);
  }

  h4 {
    font-size: 1.2em;
    color: var(--info-sheet-heading-color);
  }

  h5 {
    font-size: 1em;
    font-weight: bold;
    margin-top: 1em;
    color: var(--info-sheet-heading-color);
  }

  li {
    margin-block: 0.5em;
  }

  details {
    user-select: none;
    margin-block: 0.5em;
    outline: 1px solid rgba(255, 255, 255, 0.50);
    padding: 2px 1em;
    border-radius: 2px;
    cursor: pointer;
  }
  details:hover {
    outline: 2px solid #aeaeae;
  }

  pre {
    background-color: rgb(50, 50, 50);
    padding: 0.5em;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.8em;
  }
}

.bullet-icon {
  color: currentColor;
  width: 1.2em;
  padding-right: 0.5em;
}


.info-sheet {

  .info-text {
    height: fit-content;
  }


  .info-sheet-tabs {
    width: calc(100% - 3em);
    align-self: left;
  }

  .scrollable {
    overflow-y: visible;
    height: 100%;
  }

  #tab-items {
    height: calc(100% - 32px);
    overflow-y: auto;

    .v-card.border-radius-0 {
      border-radius: 0 !important;
    }

    .v-card-text {
      font-size: ~"max(13px, calc(0.6em + 0.3vw))";
      padding-top: ~"max(2vw, 16px)";
      // Fixed, not 4vw: the sheet's column is capped at a fixed width now, so
      // viewport-relative gutters grew while the column did not -- on an
      // ultrawide they took 276px of it and left the prose ~21 characters wide.
      // 16px is the floor this already resolved to on a phone.
      padding-left: 16px;
      padding-right: 16px;


      .end-spacer {
        height: 25px;
      }
    }

  }

  #close-text-icon {
    position: absolute;
    top: 0.5em;
    right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
    color: white;

    &:hover {
      cursor: pointer;
    }
  }
  

  #close-text-icon {
    top: 0.25em;
    right: calc((2em - 0.6875em) / 3);
  }


  // This prevents the tabs from having some extra space to the left when the screen is small
  // (around 400px or less)
  .v-tabs:not(.v-tabs--vertical).v-tabs--right>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__next,
  .v-tabs:not(.v-tabs--vertical):not(.v-tabs--right)>.v-slide-group--is-overflowing.v-tabs-bar--is-mobile:not(.v-slide-group--has-affixes) .v-slide-group__prev {
    display: none;
  }
}
</style>
