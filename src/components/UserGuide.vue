<!-- The User Guide tab's content, lifted out of InformationSheet.vue when that
     moved to why-roman's tab-registration structure. Same content as before. -->
<template>
  <InfoPage title="User Guide" value="user-guide">
    <div>
      <h4 class="user-guide-header mt-5">
        Sky Navigation
      </h4>
      <p>
        To navigate the WWT view, use the following controls:
      </p>
      <v-row
        align="center"
        dense
        class="mt-2 mx-3"
      >
        <v-col cols="4">
          <v-chip
            label
            density="compact"
            variant="outlined"
          >
            Pan
          </v-chip>
        </v-col>
        <v-col
          cols="8"
          class="pt-1"
        >
          <strong>{{ touchscreen ? "press + drag" : "click + drag" }}</strong> {{ touchscreen ? "" : "or" }}
          <strong>{{ touchscreen ? "" : "W-A-S-D" }}</strong> {{ touchscreen ? "" : "keys" }}<br>
        </v-col>
      </v-row>
      <v-row
        align="center"
        dense
        class="mx-3"
      >
        <v-col cols="4">
          <v-chip
            label
            density="compact"
            variant="outlined"
          >
            Zoom
          </v-chip>
        </v-col>
        <v-col
          cols="8"
          class="pt-1"
        >
          <strong>{{ touchscreen ? "pinch in and out" : "scroll in and out" }}</strong> {{ touchscreen ? "" :
            "or" }} <strong>{{ touchscreen ? "" : "I-O" }}</strong> {{ touchscreen ? "" : "keys" }}<br>
        </v-col>
      </v-row>
      <v-row
        align="center"
        dense
        class="mx-3"
      >
        <v-col cols="4">
          <v-chip
            label
            density="compact"
            variant="outlined"
          >
            Rotate
          </v-chip>
        </v-col>
        <v-col
          cols="8"
          class="pt-1"
        >
          {{ touchscreen ? "" : "press" }} <strong>{{ touchscreen ? "pinch and twist" : "control + click + drag"
          }}</strong> {{ touchscreen ? "" : "" }} <strong>{{ touchscreen ? "" : "" }}</strong> {{ touchscreen
            ? "" : "" }}<br>
        </v-col>
      </v-row>

      <!-- Credits -->
      <v-row>
        <v-col cols="12">
          <div class="credits">
            <h4 class="user-guide-header mt-3">
              Credits
            </h4>
            <h5>
              <easyLink
                href="https://www.almagal.org/"
              >
                ALMAGAL Survey
              </easyLink>
            </h5>
            <p>Dr. Jennifer Wallace</p>
            <p>Prof. Cara Battersby (Co-I, ALMAGAL)</p>
            <br />
            <p>
              Data and Catalog from ALMAGAL. 
            </p>
            <p>
              Paper reference: Wallace et al. 2026 (<easyLink href="https://ui.adsabs.harvard.edu/abs/2026ApJ...998..302W">
                2026ApJ...998..302W
              </easyLink>)
            </p>
            <h5>
              <easyLink
                href="https://www.cosmicds.cfa.harvard.edu/"
              >
                CosmicDS
              </easyLink>
            </h5>
            <p>John Lewis</p>
            <p>Jon Carifio</p>
            <p>Pat Udomprasert</p>
            <p>Alyssa Goodman</p>

            <h5>
              <a
                href="https://www.worldwidetelescope.org/home"
                target="_blank"
                rel="noopener noreferrer"
              >WorldWide Telescope</a>
            </h5>
            <p>Jon Carifio</p>
            <p>Peter Williams</p>
            <p>David Weigel</p>
          </div>
          <v-spacer class="end-spacer"></v-spacer>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <funding-acknowledgement />
        </v-col>
      </v-row>
    </div>
  </InfoPage>
</template>

<script setup lang="ts">
import { h, type SetupContext } from 'vue';
import { supportsTouchscreen, FundingAcknowledgement } from '@cosmicds/vue-toolkit';
import InfoPage from './InfoPage.vue';

// https://v3-migration.vuejs.org/breaking-changes/functional-components
const easyLink = (props: { href: string }, { slots }: SetupContext) => {
  return h('a', { href: props.href, target: '_blank' }, slots.default?.());
};

const touchscreen = supportsTouchscreen();
</script>

<style scoped>
/* the gap under the credits, so the last line clears the bottom of the sheet */
.end-spacer {
  height: 25px;
}
</style>
