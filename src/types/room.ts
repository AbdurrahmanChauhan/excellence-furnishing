import { TimestampString } from './common';

export type RoomType =
  | 'living_room'
  | 'master_bedroom'
  | 'guest_bedroom'
  | 'kids_bedroom'
  | 'dining_room'
  | 'home_theatre'
  | 'balcony'
  | 'study_office'
  | 'pooja_room'
  | 'other';

export interface Room {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly type: RoomType;
  readonly floor?: string;
  readonly photos: readonly string[];
  readonly notes?: string;
  readonly measurementsCount: number;
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}

export type RoomCreateInput = Omit<Room, 'id' | 'measurementsCount' | 'createdAt' | 'updatedAt'>;
export type RoomUpdateInput = Partial<RoomCreateInput>;
