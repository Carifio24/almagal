import { computed } from "vue";
import { engineStore } from '@wwtelescope/engine-pinia';

const THREED_VIEW_NAME = "3D Solar System View";

type Wwt3dHook = () => void;

interface Wwt3dControlOptions {
  /** run when we finish to 3d transition */
  on3d?: Wwt3dHook;
  /** run when we finish to 2d transition */
  on2d?: Wwt3dHook;
}

/** Switching between the sky and the 3D solar system, and back to wherever the
    sky view was pointed. `in3D` is derived from the store, not kept alongside it. */
function createWwt3dControl(
  store: ReturnType<typeof engineStore>,
) {


  const enter3dHooks: Wwt3dHook[] = [];
  const exit3dHooks: Wwt3dHook[] = [];

  /** run `hook` once the move into 3D has finished */
  function onEnter3d(hook: Wwt3dHook) {
    if (!enter3dHooks.includes(hook)) enter3dHooks.push(hook);
  }

  /** run `hook` once the move back to the saved 2D view has finished */
  function onExit3d(hook: Wwt3dHook) {
    if (!exit3dHooks.includes(hook)) exit3dHooks.push(hook);
  }

  let oldBackgroundLayer: string | null = null;
  let oldPosition: {ra: number, dec: number, zoom: number, roll: number} | null = null;


  function switchTo3D(): Promise<void> {
    if (store.backgroundImageset) {
      oldBackgroundLayer = store.backgroundImageset.get_name();
    }
    
    oldPosition = {
      ra: store.raRad,
      dec: store.decRad,
      zoom: store.zoomDeg,
      roll: store.rollRad,
    };
    console.log("Switching to 3D, saving old position", oldPosition);
    
    store.setBackgroundImageByName(THREED_VIEW_NAME);
    
    // look back towards where we were pointed. 
    // in 3d mode this is where our eye is pointed towards the sun
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        if (!oldPosition) return resolve(); // should never happen, but just in case
        store.gotoRADecZoom({
          raRad: -(oldPosition.ra + Math.PI / 2),
          decRad: -(oldPosition.dec + 23.5 * Math.PI / 180), // rotate by earth' approximate obliquity
          rollRad: 62.9 * Math.PI / 180, // tilt by angle between celestial equator & galactic planes
          zoomDeg: 2 * 15000 * 9 / 4,
          instant: true,
        }).then(() => resolve());
      });
    });
  }

  function switchTo2D(): Promise<void> {
    console.log("Switching back to 2D");
    if (oldBackgroundLayer) {
      store.setBackgroundImageByName(oldBackgroundLayer);
    }
    
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        // need to wait a tick for WWT to finish switching the background layer
        if (!oldPosition) return resolve();
        console.log("Going back to old position", oldPosition);
        store.gotoRADecZoom({
          raRad: oldPosition.ra,
          decRad: oldPosition.dec,
          zoomDeg: oldPosition.zoom,
          rollRad: oldPosition.roll,
          instant: true
        }).then(() => resolve());
      });
    });
  }

  const in3D = computed({
    get: () => store.backgroundImageset?.get_name() === THREED_VIEW_NAME,
    set: (value: boolean) => {
      if (value) {
        switchTo3D().then(() => enter3dHooks.forEach(hook => hook()));
      } else {
        switchTo2D().then(() => exit3dHooks.forEach(hook => hook()));
      }
    }
  });

  function toggle3d() {
    in3D.value = !in3D.value;
  }

  return { in3D, toggle3d, switchTo3D, switchTo2D, onEnter3d, onExit3d };
}

/* singleton so we can use it everywhere */
let control: ReturnType<typeof createWwt3dControl> | null = null;
export function useWwt3dControl(
  store: ReturnType<typeof engineStore>,
  options: Wwt3dControlOptions = {}
) {
  if (!control) {
    control = createWwt3dControl(store);
  }
  if (options.on3d) control.onEnter3d(options.on3d);
  if (options.on2d) control.onExit3d(options.on2d);
  return control;
}
