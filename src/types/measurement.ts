import { Paise, TimestampString } from './common';

export type ProductMeasurementType = 'curtain' | 'wallpaper' | 'upholstery';

export type HeadingStyle =
  | 'eyelet'
  | 'pinch_pleat_single'
  | 'pinch_pleat_double'
  | 'pinch_pleat_triple'
  | 'wave_s_fold'
  | 'rod_pocket'
  | 'box_pleat'
  | 'goblet_pleat';

export type LiningType =
  | 'unlined'
  | 'none'
  | 'cotton'
  | 'blackout'
  | 'thermal';

export type MotorizationType =
  | 'manual'
  | 'motorized_somfy'
  | 'motorized_generic';

export type MotorBrand = 'somfy' | 'generic' | 'generic_standard';

export interface CurtainConfig {
  readonly type: 'curtain';
  readonly trackWidthCm: number;
  readonly dropLengthCm: number;
  readonly fullnessRatio: number;
  readonly headingStyle: HeadingStyle;
  readonly liningType: LiningType;
  readonly motorized: boolean;
  readonly motorBrand?: MotorBrand;
  readonly panels: 1 | 2 | 4;
  readonly fabricWidthCm?: number; // 140 standard or 280 broadloom
  readonly fabricId?: string;
  readonly fabricName?: string;
  readonly hardwareOption?: 'none_existing' | 'decorative_rod' | 'ceiling_track' | 'double_track';
}

export type WallpaperPatternRepeat =
  | 'none_free_match'
  | 'straight_match'
  | 'drop_match'
  | 'random_match';

export interface WallpaperConfig {
  readonly type: 'wallpaper';
  readonly wallWidthFt: number;
  readonly wallHeightFt: number;
  readonly patternRepeatCm?: number; // 0 for plain
  readonly patternRepeatType?: WallpaperPatternRepeat;
  readonly rollWidthFt?: number; // Standard 1.74 ft (21 inches)
  readonly rollLengthFt?: number; // Standard 32.8 ft (10 meters)
  readonly usableCoverageSqFtPerRoll?: number; // Standard 45 sq.ft
  readonly includeInstallation: boolean;
  readonly wallpaperId?: string;
  readonly wallpaperName?: string;
}

export type FurnitureType =
  | 'armchair_1_seater'
  | 'loveseat_2_seater'
  | 'sofa_3_seater'
  | 'sectional_5_seater'
  | 'dining_chair_seat_only'
  | 'dining_chair_full'
  | 'ottoman_footstool'
  | 'bed_headboard';

export type FoamGrade =
  | 'none'
  | 'standard_32_density'
  | 'hd_40_density'
  | 'latex_orthopedic_layer';

export interface UpholsteryConfig {
  readonly type: 'upholstery';
  readonly furnitureType: FurnitureType;
  readonly seatCount?: number;
  readonly includeFoamReplacement?: boolean;
  readonly foamGrade?: FoamGrade;
  readonly cushionCount?: number;
  readonly customFabricMeters?: number;
  readonly fabricId?: string;
  readonly fabricName?: string;
  readonly woodRefinishing?: boolean;
}

export type MeasurementConfig =
  | CurtainConfig
  | WallpaperConfig
  | UpholsteryConfig;

export interface ItemizedCost {
  readonly label: string;
  readonly amountPaise: Paise;
}

export interface MeasurementBreakdown {
  readonly fabricRequiredMeters?: number;
  readonly rollsRequired?: number;
  readonly totalAreaSqFt?: number;

  readonly materialCostPaise: Paise;
  readonly stitchingCostPaise?: Paise;
  readonly liningCostPaise?: Paise;
  readonly liningSurchargePaise?: Paise;
  readonly motorCostPaise?: Paise;
  readonly installationCostPaise?: Paise;
  readonly laborCostPaise?: Paise;
  readonly foamCostPaise?: Paise;

  readonly subtotalPaise: Paise;
  readonly itemizedSummary: readonly ItemizedCost[];
}

export interface RoomMeasurement {
  readonly id: string;
  readonly clientId: string;
  readonly roomId: string;
  readonly label: string; // e.g., 'Master Bedroom East Window'
  readonly productType: ProductMeasurementType;
  readonly configuration: MeasurementConfig;

  // Selected product details
  readonly productId: string;
  readonly productName: string;
  readonly unitPricePaise: Paise;

  readonly breakdown: MeasurementBreakdown;
  readonly totalEstimatePaise: Paise;

  readonly isConvertedToOrder: boolean;
  readonly orderId?: string;

  readonly notes?: string;
  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}
