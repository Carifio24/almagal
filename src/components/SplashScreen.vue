<template>
  <v-overlay
    id="splash-overlay"
    :model-value="showSplashScreen"
    :scrim="true"
    

    absolute
    :style="cssVars"
    transition="fade-transition"
  >
    <focus-trap>
      <div
        id="splash-screen"
        v-click-outside="closeSplashScreen"
        :style="cssVars"
      >
        <div class="background">
          <div class="background-blur"></div>
        </div>
        <div
          id="first-splash-row"
        >
          <font-awesome-icon
            id="close-splash-button"
            icon="xmark"
            tabindex="0"
            @click="closeSplashScreen"
            @keyup.enter="closeSplashScreen"
          />
          <div
            id="splash-screen-text"
            class="mb-2"
          >
            <p class="highlight">
              <img :src="almagalImage" /> ALMAGAL
            </p>
            <p>Understanding how stars form in our galaxy</p>
          </div>
        </div>

        <!-- <SplashGesture /> -->

        <div class="splash-buttons">
          <v-btn
            class="splash-get-started mt-4"
            :color="highlightColor"
            :density="(xs || isLandscape) ? 'compact' : 'comfortable'"
            :size="(width < 250 || short) ? 'large' : 'x-large'"
            variant="flat"
            elevation="10"
            rounded="2"
            @click="tourOption"
            @keyup.enter="tourOption"
          >
            Give me a guided tour
          </v-btn>
          <v-btn
            class="splash-get-started my-2"
            :color="highlightColor"
            :density="(xs || isLandscape) ? 'compact' : 'comfortable'"
            :size="(width < 250 || short) ? 'large' : 'x-large'"
            variant="flat"
            elevation="10"
            rounded="2"
            @click="exploreOption"
            @keyup.enter="exploreOption"
          >
            Let me explore on my own
          </v-btn>
        </div>

        <div id="splash-screen-acknowledgements">
          <div id="splash-screen-logos">
            <credit-logos
              id="splash-screen-credit-logos"
              logo-size="1em"              
              :default-logos="['cosmicds', 'wwt', 'sciact', 'nasa']"
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
    </focus-trap>
  </v-overlay>
</template>


<script setup lang="ts">
import { computed } from 'vue';
import { FocusTrap } from "focus-trap-vue";
import { useDisplay } from 'vuetify';
import almagalImage from '@/assets/almagal-header.png';

const {width, xs, height } = useDisplay();
const isLandscape = computed(() => width.value > height.value * 1.25);
const short = computed(() => height.value < 400);
export interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cssVars?: any;
  accentColor?: string;
  highlightColor?: string;
  loaded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  cssVars: () => ({}),
  loaded: true,
  accentColor: 'white',
  highlightColor: 'white',
});

const cssVars = computed(() => ({
  ...props.cssVars,
  '--accent-color': props.accentColor,
  '--highlight-color': props.highlightColor,
}));

const showSplashScreen = defineModel<boolean>({ default: false });
const splash = new URLSearchParams(window.location.search).get("splash")?.toLowerCase() !== "false";
if (!splash) {
  showSplashScreen.value = false;
}


function closeSplashScreen() {
  if (props.loaded) {
    showSplashScreen.value = false;
  }
}

const emits = defineEmits(['tour', 'explore']);

function tourOption() {
  if (props.loaded) {
    showSplashScreen.value = false;
    emits('tour');
  }
}

function exploreOption() {
  if (props.loaded) {
    showSplashScreen.value = false;
    emits('explore');
  }
}


</script>


<style scoped lang="less">

@font-face {
  font-family: "Highway Gothic Narrow";
  src: url("../assets/HighwayGothicNarrow.ttf") format("truetype");
}

@font-face {
  font-family: "Segoe UI Semibold";
  src: url("../assets/Segoe UI Semibold.ttf") format("truetype");
  font-weight: 600;
}

#splash-overlay {
  align-items: center;
  justify-content: center;
  font-size: 2em;
  transition: width 0.5s, height 0.5s;
  --size: min(10vmin,80px);
}

#splash-overlay > :deep(.v-overlay__scrim) {
  backdrop-filter: blur(15px);
}

:deep(.v-fade-transition-enter-active),
:deep(.v-fade-transition-leave-active) {
  transition-duration: 6000ms !important;
}

#splash-screen {
  color: white;
  user-select: none;
  contain: paint;
  min-width: 200px;
  min-width: 200px;

  // @media (max-width: 699px) {
  //   max-height: 80vh;
  //   max-width: 90vw;
  // }

  // @media (min-width: 700px) {
  //   max-height: 85vh;
  //   max-width: min(70vw, 800px);
    
  // }
  --border-radius: 30px;


  .background {
    position: fixed;
    inset: 0;
    // background-image: url('../assets/image-1.png');
    // background-size: cover;
    // background-repeat: no-repeat;
    background-color: var(--accent-color);
    contain: strict;
    z-index: -1;
  }

  .background-blur {
    backdrop-filter: blur(1px) saturate(2) brightness(0.4);
    position: fixed;
    inset: 0;
    margin: 0;
  }

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  padding-top: 2rem;
  padding-bottom: 1rem;
  padding-inline: 2rem;

  border-radius: 0; // var(--border-radius);
  border: 2px solid var(--highlight-color) ; //min(1.2vw, 0.9vh) solid var(--highlight-color);
  overflow: auto;
  font-family: "Highway Gothic Narrow", sans-serif;

  div {
    text-align: center;
  }

  a {
    color: white;
  }
  // make a paragraph inside the div centered horizontally and vertically
  p {
    font-weight: regular;
    vertical-align: middle;
  }

  p.highlight {
    color: var(--highlight-color);
    text-transform: uppercase;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    font-size: var(--size);
    color: white;
    font-family: "Segoe UI Semibold";
    
    > img {
      height: calc(var(--size) * 1.2);
    }
  }


  p.small {
    font-size: 0.8em;
    font-weight: bold;
  }

  #first-splash-row {
    width: 100%;
  }

  #close-splash-button {
    position: absolute;
    top: 20px;
    right: 20px;
    text-align: end;
    color: var(--button-color, white);
    font-size: min(5vw, 4vh);
    padding: 0.25rem;
    margin: -0.25rem;

    &:hover {
      cursor: pointer;
    }
  }

  #splash-screen-text {
    // in the grid, the text is in the 2nd column
    display: flex;
    flex-direction: column;
    line-height: 2;
    font-size: min(1em, calc(0.75 * var(--size)));
  }

  .splash-get-started {
    // border: 2px solid white;
    font-size: 0.75em;
    font-weight: bold !important;
    text-transform: none;
  }

  #splash-screen-guide {
    margin-block: 1.5em;
    // font-size: min(5vw, 4vh);
    line-height: 140%;
    width: 75%;

    .v-col{
      padding: 0;
    }

    .svg-inline--fa {
      color:var(--accent-color);
      margin: 0 10px;
    }
  }

  #splash-screen-acknowledgements {
    // margin-top: 3rem;
    margin: clamp(0.5rem, 3vh, 3rem) auto;
    font-size: 1em;
    line-height: 1.2;
    width: 80%;
    width:fit-content;

    @media only screen and (max-width: 600px) {
      width: 80%;
    }
  }

  #splash-screen-credit-logos {
    img {
    height: 65px;
    vertical-align: middle;
    margin-inline: 0.5em;
    }

    @media only screen and (max-width: 600px) {
      img {
        height: 40px;
      }
    }

    svg {
      vertical-align: middle;
      height: 24px;
    }
  }
}

@media (max-height: 500px) {
  #splash-screen {
    // display: flex;
    // flex-direction: column;
    // max-width: 200vh;
    // justify-content: center;
    // align-items: center;
    // gap: calc(0.5 * var(--default-line-height));
    overflow: hidden;

  #splash-screen-text {
    line-height: 1.2;
  }

  .splash-get-started {
    margin-bottom: 0;
  }

  #splash-screen-acknowledgements {
    font-size: 1em;
  }
}

}

@media (max-height: 310px) {
  #splash-screen {
    width: 50vw;
    padding-block: 10px;
  }
  #splash-screen-acknowledgements  {
    display: none;
  }
}

#artemis-large-logo {
  height: 100px;
}

@media (min-width: 600px) {
  #artemis-large-logo {
    height: 200px;
  }
}

.splash-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

</style>
