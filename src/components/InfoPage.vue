<template>
  <v-window-item :value="tabValue">
    <v-card
      class="scrollable border-radius-0"
      :class="{'info-page-active': _isActive}"
      elevation="0"
    >
      <v-card-text class="info-text scrollable">
        <slot />
      </v-card-text>
    </v-card>
  </v-window-item>
</template>
<script setup lang="ts">
// comments are not ai, they are from the article :)
// adapted from https://vueschool.io/articles/vuejs-tutorials/tightly-coupled-components-vue-components-with-provide-inject/
import { inject, computed, onUnmounted } from "vue";

// Notice that import the injection key from the `vTabs` component
// since it's a symbol we can be absolutely certain it's unique
// and since these are tightly coupled it makes sense to get it from the parent
import { injectionKey } from "./InformationSheet.vue";

// This is a simple title prop
const props = defineProps<{
    title: string,
    value?: string,
  }>();

// This is where the magic happens
// Here we "pick up" the data provided by the parent
const tabsProvider = inject(injectionKey, null);
// If withinTabs is false, then the injected data wasn't provided
// Why? because withinTabs defaults to false. Well for this it is undefined
// So we're outside the context of `InformationSheet` which is not a valid use of the panel component
if (!tabsProvider?.withinTabs) {
  throw new Error('InformationPage must be used within an InformationSheet');
}

// https://www.geeksforgeeks.org/javascript/how-to-convert-a-string-into-kebab-case-using-javascript/
const kebabCase = (str: string) => str
  .replace(/([a-z])([A-Z])/g, "$1-$2")
  .replace(/[\s_]+/g, '-')
  .toLowerCase();

// key on the unique value prop so we don't depend on the registration order
const tabValue = props.value ?? kebabCase(props.title);

// Here we push our panels title to the parent so that it can display the tabs properly
tabsProvider.registerTab(tabValue, props.title);

// The first panel is the default active one, which is already what the parent's
// tab model defaults to. A panel must not claim the default itself: the check
// that used to live here was falsy-based, so activeTab === 0 kept it true past
// the first panel and the last one registered ended up winning.

// Finally just check to see if this panel should be active
// based on the active `activeTab` state from the parent
const _isActive = computed(() => tabsProvider.activeTab.value === tabValue);

onUnmounted(() => {
  const unregisered = tabsProvider.unregisterTab(tabValue);
  if (!unregisered) {
    console.warn(`InfoPage "${props.title}" was not unregistered. Check that it was registered properly`);
  } else {
    console.log(`InfoPage "${props.title}" unregistered successfully`);
  }
});
</script>
