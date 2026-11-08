import { Paise, UnitType, TimestampString } from './common';

export type MainCategory =
  | 'curtains_window_treatments'
  | 'sofa_upholstery_fabrics'
  | 'wallpapers'
  | 'mattresses_sleep_solutions'
  | 'bedding_accessories'
  | 'home_decor';

export type SubCategory =
  // Curtains & Window Treatments
  | 'sheer_curtains'
  | 'heavy_drapes'
  | 'blackout_curtains'
  | 'printed_curtains'
  | 'roman_blinds'
  | 'roller_blinds'
  | 'vertical_blinds'
  // Sofa Upholstery
  | 'pu_leather_rexine'
  | 'velvet_upholstery'
  | 'jacquard_weaves'
  | 'suede_microfiber'
  | 'cotton_linen_blends'
  | 'commercial_heavy_duty'
  // Wallpapers
  | 'pvc_vinyl'
  | 'non_woven'
  | 'textured_metallic'
  | '3d_wallpaper'
  | 'custom_murals'
  // Mattresses
  | 'orthopedic_mattress'
  | 'latex_mattress'
  | 'memory_foam_mattress'
  | 'pocket_spring_mattress'
  | 'coir_mattress'
  | 'sofa_cum_bed_mattress'
  // Bedding & Accessories
  | 'bedsheet_sets'
  | 'pillow_cushion_covers'
  | 'quilts_comforters'
  | 'mattress_protectors'
  // Home Decor
  | 'carpets_rugs'
  | 'custom_headboards'
  | 'mosquito_nets'
  | 'artificial_turf';

export type PatternType =
  | 'plain'
  | 'damask'
  | 'floral'
  | 'geometric'
  | 'abstract'
  | 'textured'
  | 'striped';

export interface ProductMetadata {
  readonly fabricWidthCm?: number;
  readonly weightGsm?: number;
  readonly composition?: string;
  readonly patternRepeatCm?: number;
  readonly rollWidthFt?: number;
  readonly rollLengthFt?: number;
  readonly rollAreaSqFt?: number;
  readonly mattressThicknessInches?: number;
  readonly mattressFirmness?:
    | 'soft'
    | 'medium_soft'
    | 'medium'
    | 'medium_firm'
    | 'firm'
    | 'orthopedic_hard';
  readonly warrantyYears?: number;
  readonly careInstructions?: readonly string[];
  readonly originCountry?: string;
}

export interface Product {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly brand: string;
  readonly category: MainCategory;
  readonly subcategory: SubCategory;
  readonly description: string;
  readonly shortDescription: string;

  // Pricing (Integer Paise)
  readonly pricePerUnitPaise: Paise;
  readonly unit: UnitType;
  readonly mrpPaise?: Paise;

  // Media
  readonly images: readonly string[];
  readonly swatchImage: string;

  // Tax
  readonly hsnCode: string; // e.g. 5407, 4814, 9404, 6302
  readonly gstRatePercent: number; // 5, 12, or 18

  // Faceted Attributes
  readonly colors: readonly string[];
  readonly colorHexes: readonly string[];
  readonly patterns: readonly PatternType[];
  readonly materials: readonly string[];
  readonly tags: readonly string[];

  // Inventory & Status
  readonly stockQuantity: number;
  readonly isAvailable: boolean;
  readonly isFeatured: boolean;
  readonly isBestSeller: boolean;

  // Specifications
  readonly metadata: ProductMetadata;

  readonly createdAt: TimestampString;
  readonly updatedAt: TimestampString;
}
