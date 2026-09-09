/*
colors = wwtlib.ColorMapContainer.viridis.colors.map((color, index) => [index, color.r, color.g, color.b]);
cm=wwtlib.ColorMapContainer.fromArgbList(colors); // also is a .fromStringList which takes hex
wwtlib.ColorMapContainer.registerNamedColormap("viridisalpha", cm);
layer.get_imageSet().get_fitsProperties().colorMapName = "viridisalpha"
*/

import { ColorMapContainer } from "@wwtelescope/engine";
import rdbu from "@/assets/RdBu_r";
import tempo from "@/assets/tempo";

export const COLORMAPS = [
  'viridis',
  'plasma',
  'inferno',
  'magma',
  'cividis',
  'greys',
  'gray',
  'purples',
  'blues',
  'greens',
  'oranges',
  'reds',
  'rdylbu',
  'rdbu',
  'morphology',
] as const;
export type Colormaps =  typeof COLORMAPS[number];

export function addCustomColormaps() {
  const rdbuCm = ColorMapContainer.fromStringList(rdbu);
  const tempoCm = ColorMapContainer.fromStringList(tempo);
  ColorMapContainer.registerNamedColormap("rdbu", rdbuCm);
  ColorMapContainer.registerNamedColormap("tempo", tempoCm);
}
