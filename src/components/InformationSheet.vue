<!-- eslint-disable vue/max-attributes-per-line -->
<template>
  <!-- the vars go on the root so the tabs, the close icon and every InfoPage
       inherit the same set -->
  <v-card
    class="cds-info-sheet"
    color="var(--info-sheet-bg)"
    :style="cssVars"
    height="100%"
  >
    <!-- Vuetify gives the unselected tab tabindex="-1" (the ARIA roving-tabindex
         pattern, where arrow keys move between tabs) but its own arrow handling
         does not fire here, leaving that tab unreachable by keyboard. Drive it
         ourselves. -->
    
    <!-- mandatory gets rid of a recursion when v-if'ing away InfoPages
     by default has a mandatory = force, means vuetify will pick a tab if nothing is selected
     so if we are v-if'ing away what is selected, this created a cycle where because what is v-if'd
     controls what tabs are available, and so it would spiral. but we don't want that behavior anyway. 
     we want mandatory = true so the user (or the app) has to select a tab. 
      -->
    <v-tabs
      v-if="!hideTabs"
      v-model="tabName"
      :mandatory="true"
      class="cds-info-sheet-tabs"
      color="var(--info-sheet-tab-color)"
      slider-color="var(--info-sheet-slider-color)"
      density="compact"
      :align-tabs="props.alignTabs ?? 'end'"
      @keydown.left.prevent="cycleTab(-1)"
      @keydown.right.prevent="cycleTab(1)"
    >
      <v-tab 
        v-for="_tabName in tabs" 
        :key="_tabName.value"
        :value="_tabName.value"
        class="cds-info-sheet-tab" 
        :ripple="false"
        tabindex="0"
      >
        <h3>{{ _tabName.title }}</h3>
      </v-tab>
    </v-tabs>
    <!-- v-else to preserve space for tabs -->
    <div v-else-if="showCloseButton" class="cds-info-sheet-tabs" style="height: 1em;"></div>
    <v-icon
      v-if="!stayOpen || showCloseButton"
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
    <!-- mandatory for the same same reason  -->
    <v-window id="info-sheet-window" v-model="tabName" :mandatory="true" class="pb-2">
      <slot />
    </v-window>
  </v-card>
</template>

<script lang="ts">

import type { InjectionKey, Ref } from "vue";
export const injectionKey = Symbol("vTabs") as InjectionKey<{
    withinTabs: boolean;
    registerTab: (value: string, title: string) => number;
    unregisterTab: (value: string) => boolean;
    activeTab: Readonly<Ref<string>>;
    activateTab: (value: string) => void;
  }>;
  
export interface Props {
  /** tab labels and the close icon */
  tabColor?: string,
  /** the bar under the selected tab. Defaults to `tabColor`. */
  sliderColor?: string,
  /* text color for content of each InfoPage --info-sheet-text-color */
  textColor?: string,
  /* --info-sheet-heading-color */
  headingColor?: string,
  /* --info-sheet-accent-color */
  accentColor?: string,
  /** the sheet's background --info-sheet-bg */
  bgColor?: string,
  /** each InfoPage's background. Transparent by default, so `bgColor` shows through. */
  pageColor?: string,
  /** hide the tab bar, preserves some space for the close button if present */
  hideTabs?: boolean,
  /** ignores the v-model which doesn't do anything anyway  */
  stayOpen?: boolean,
  /** move tabs left, right or center */
  alignTabs?: 'start' | 'center' | 'end' | 'title',
  /** show the close button even with stayOpen true */
  showCloseButton?: boolean,
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
interface TabSpec {
  title: string;
  value: string;
}
const tabs = ref<TabSpec[]>([]);
// const tab = ref(0);

/** the tab value defined on an `<InfoPage>` to show.
 * The `InfoPage` value defaults to the kebab-case title. but can be set with `value` prop
 */
const tabName = defineModel<string>('tab', {default: ''});
/** you can also select by index. */
const tab = defineModel<number>('index', {default: 0});

const indexOfTab = (value: string) => tabs.value.findIndex(tab => tab.value === value);

watch(tab, (newTab) => {
  const spec = tabs.value[newTab];
  if (spec === undefined) {
    console.warn(`tab index ${newTab} is out of range: ${tabs.value.length} tab(s) registered`);
    return;
  }
  tabName.value = spec.value;
});

// `flush: 'post'`, and `tabs` is a source of its own, because a consumer may
// mount its pages with the tab (`v-if="tab === 'settings'"`): the page being
// asked for only registers during the render this change triggers, and the
// outgoing page only unregisters in its `onUnmounted`, which Vue queues after
// that. Pre-flush this lookup would run against neither.
watch([tabName, () => tabs.value.length], () => {
  const index = indexOfTab(tabName.value);
  if (index !== -1) {
    tab.value = index;
    return;
  }
  if (tabs.value.length === 0) {
    // nothing has registered yet; whichever page mounts first will settle it
    return;
  }
  if (tabName.value === '') {
    tabName.value = tabs.value[0].value;
    return;
  }
  console.warn(`tabName ${tabName.value} not found in tabs: ${tabs.value.map(tab => tab.value).join(', ')}`);
}, { flush: 'post' });



// This function will allow the child `vTabPanels` to register their title
// with the parent `vTabs`
// Again it's a function because of the reasoning above.
function registerTab(value: string, title: string) {
  // const existing = tabs.value.indexOf(title);
  const existing = tabs.value.findIndex(tab => tab.value === value && tab.title === title);
  if (existing !== -1) return existing;
  tabs.value.push({value, title});
  return tabs.value.length - 1;
}

function activateTab(value: string) {
  tabName.value = value;
}

function unregisterTab(value: string) {
  // const index = tabs.value.indexOf(title);
  const index = tabs.value.findIndex(tab => tab.value === value);
  if (index !== -1) {
    tabs.value.splice(index, 1);
    return true;
  }
  return false;
}

// left/right through the tabs, wrapping, then move focus to the new one so the
// keyboard user can see where they are
function cycleTab(delta: number) {
  const count = tabs.value.length;
  if (count < 2) {
    return;
  }
  const current = indexOfTab(tabName.value);
  tabName.value = tabs.value[(current + delta + count) % count].value;
  nextTick(() => {
    const selected = document.querySelector<HTMLElement>(".cds-info-sheet-tab.v-tab--selected");
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
  unregisterTab,

  // We expose the active tab to the child
  // but notice we use readonly to keep the child from directly mutating it
  activeTab: readonly(tabName),
});








const props = defineProps<Props>();
  
if (props.stayOpen) {
  showTextSheet.value = true;
}

watch(() => props.stayOpen, (stayOpen) => {
  if (stayOpen) showTextSheet.value = true;
});



const cssVars = computed(() => {
  return {
    '--info-sheet-bg': props.bgColor ?? 'rgb(var(--v-theme-surface))',
    '--info-sheet-page-bg': props.pageColor ?? 'transparent',
    '--info-sheet-text-color': props.textColor ?? '#ffffff',
    '--info-sheet-heading-color': props.headingColor ?? 'var(--info-sheet-text-color)',
    '--info-sheet-accent-color': props.accentColor ?? props.tabColor,
    '--info-sheet-tab-color': props.tabColor ?? 'white',
    '--info-sheet-slider-color': props.sliderColor ?? 'var(--info-sheet-tab-color)',
  };
});

</script>


<style lang="less">

.cds-info-sheet-tab h3 {
  font-size: 0.9em;
}

// this will make them narrower
// the double .v-tab is used to beat vuetify's specificity.
// .cds-info-sheet-tab.v-btn.v-tab.v-tab {
//   padding-inline: 4px;
//   min-width: 0px;
// }
.cds-info-sheet-tab.v-btn.v-tab.v-tab.v-tab--selected {
  background-color: rgba(255, 255, 255, 0.05);
}

.cds-info-sheet {
  
  .cds-info-sheet-tabs {
    width: calc(100% - 3em);
    align-self: left;
  }

  #info-sheet-window {
    height: calc(100% - 32px);
    overflow-y: auto;
  }

  #close-text-icon {
    position: absolute;
    top: 0.5em;
    right: calc((3em - 0.6875em) / 3); // font-awesome-icons have width 0.6875em
    color: var(--info-sheet-tab-color, white);

    &:hover {
      cursor: pointer;
    }
  }
  

  #close-text-icon {
    top: 0.25em;
    right: calc((2em - 0.6875em) / 3);
  }

}


.cds-info-sheet .info-text {
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
  
  .bullet-icon {
    color: currentColor;
    width: 1.2em;
    padding-right: 0.5em;
  }
}


</style>
