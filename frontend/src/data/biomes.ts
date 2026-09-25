import {
  Plant,
  Tree,
  Grains,
  Mountains,
  Sun,
  Cactus,
  Leaf,
  Waves,
  type Icon,
} from '@phosphor-icons/react';

import agricultureLr from '../assets/presets/Landcover-785992_10m.png';
import agricultureSr from '../assets/presets/Landcover-785992_enhanced_2.5m.png';
import farmlandLr from '../assets/presets/Landcover-1339025_10m.png';
import farmlandSr from '../assets/presets/Landcover-1339025_enhanced_2.5m.png';
import savannaLr from '../assets/presets/Landcover-111570_10m.png';
import savannaSr from '../assets/presets/Landcover-111570_enhanced_2.5m.png';
import woodlandLr from '../assets/presets/Landcover-536622_10m.png';
import woodlandSr from '../assets/presets/Landcover-536622_enhanced_2.5m.png';
import highlandsLr from '../assets/presets/Landcover-613267_10m.png';
import highlandsSr from '../assets/presets/Landcover-613267_enhanced_2.5m.png';
import shrublandLr from '../assets/presets/Landcover-755082_10m.png';
import shrublandSr from '../assets/presets/Landcover-755082_enhanced_2.5m.png';
import desertLr from '../assets/presets/Landcover-817664_10m.png';
import desertSr from '../assets/presets/Landcover-817664_enhanced_2.5m.png';
import coastalLr from '../assets/presets/Landcover-1105538_10m.png';
import coastalSr from '../assets/presets/Landcover-1105538_enhanced_2.5m.png';

export interface Biome {
  id: string;
  label: string;
  icon: Icon;
  lr: string;
  sr: string;
}

export const BIOMES: Biome[] = [
  { id: 'Landcover-1339025', label: 'Farmland', icon: Grains, lr: farmlandLr, sr: farmlandSr },
  { id: 'Landcover-785992', label: 'Agriculture', icon: Plant, lr: agricultureLr, sr: agricultureSr },
  { id: 'Landcover-536622', label: 'Woodland', icon: Tree, lr: woodlandLr, sr: woodlandSr },
  { id: 'Landcover-613267', label: 'Highlands', icon: Mountains, lr: highlandsLr, sr: highlandsSr },
  { id: 'Landcover-111570', label: 'Savanna', icon: Sun, lr: savannaLr, sr: savannaSr },
  { id: 'Landcover-755082', label: 'Shrubland', icon: Leaf, lr: shrublandLr, sr: shrublandSr },
  { id: 'Landcover-817664', label: 'Desert', icon: Cactus, lr: desertLr, sr: desertSr },
  { id: 'Landcover-1105538', label: 'Coastal', icon: Waves, lr: coastalLr, sr: coastalSr },
];

export const biomeById = (id: string): Biome => BIOMES.find((b) => b.id === id) ?? BIOMES[0];
