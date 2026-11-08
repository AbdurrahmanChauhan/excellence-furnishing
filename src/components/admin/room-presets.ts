import * as React from 'react';
import {
  Sofa,
  BedDouble,
  Baby,
  Bed,
  Utensils,
  Briefcase,
  SunMedium,
  Home,
} from 'lucide-react';
import { RoomType } from '@/types/room';

export interface RoomPreset {
  type: RoomType;
  label: string;
  icon: React.ElementType;
  defaultName: string;
}

export const ROOM_PRESETS: readonly RoomPreset[] = [
  { type: 'living_room', label: 'Living Room', icon: Sofa, defaultName: 'Living Room Balcony Window' },
  { type: 'master_bedroom', label: 'Master Bedroom', icon: BedDouble, defaultName: 'Master Bedroom French Window' },
  { type: 'kids_bedroom', label: 'Kids Room', icon: Baby, defaultName: 'Kids Bedroom Window' },
  { type: 'guest_bedroom', label: 'Guest Bedroom', icon: Bed, defaultName: 'Guest Suite Window' },
  { type: 'dining_room', label: 'Dining Room', icon: Utensils, defaultName: 'Dining Room Accent Wall' },
  { type: 'study_office', label: 'Study / Office', icon: Briefcase, defaultName: 'Study Room Roller Blinds' },
  { type: 'balcony', label: 'Balcony / Terrace', icon: SunMedium, defaultName: 'Balcony Sit-Out Area' },
  { type: 'other', label: 'Terrace / Custom', icon: Home, defaultName: 'Terrace Lounge Space' },
];

export function getRoomIcon(type: RoomType): React.ElementType {
  const match = ROOM_PRESETS.find((p) => p.type === type);
  return match ? match.icon : Home;
}
