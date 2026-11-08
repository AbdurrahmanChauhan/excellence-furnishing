import { HeadingStyle, LiningType, FurnitureType, FoamGrade } from '@/types/measurement';

export interface RateCard {
  stitchingRates: Record<HeadingStyle, number>; // ₹ per fabric meter
  liningRates: Record<LiningType, number>; // ₹ per fabric meter
  liningSurchargePercent: number; // 0.40 = 40% dual-layer labor fee
  hemAllowanceCm: number; // standard 25cm
  defaultFabricWidthCm: number; // standard 140cm
  motorization: {
    somfy: {
      smallTrackMaxCm: number; // 300cm
      smallTrackPrice: number; // ₹12,500
      largeTrackPrice: number; // ₹16,500
    };
    generic: {
      smallTrackMaxCm: number; // 300cm
      smallTrackPrice: number; // ₹7,500
      largeTrackPrice: number; // ₹10,500
    };
  };
  wallpaper: {
    standardRollWidthFt: number; // 1.74 ft
    standardRollLengthFt: number; // 32.8 ft
    standardGrossAreaSqFt: number; // 57.07 sq.ft
    defaultCoverageSqFt: {
      plainTexture: number; // 50 sq.ft
      smallRepeat: number; // 47 sq.ft
      standardRepeat: number; // 45 sq.ft
      largeRepeat: number; // 40 sq.ft
    };
    installationRatePerSqFt: number; // ₹20 / sq.ft
  };
  upholstery: {
    fabricMeters: Record<FurnitureType, number>;
    baseLaborCharge: Record<FurnitureType, number>;
    foamRatesPerSeat: Record<FoamGrade, number>;
  };
  defaultGstRatePercent: number; // 18%
}

export const DEFAULT_RATE_CARD: RateCard = {
  stitchingRates: {
    eyelet: 150,
    rod_pocket: 150,
    pinch_pleat_single: 200,
    pinch_pleat_double: 240,
    pinch_pleat_triple: 280,
    wave_s_fold: 280,
    box_pleat: 300,
    goblet_pleat: 320,
  },
  liningRates: {
    unlined: 0,
    none: 0,
    cotton: 180,
    blackout: 350,
    thermal: 420,
  },
  liningSurchargePercent: 0.4, // 40%
  hemAllowanceCm: 25,
  defaultFabricWidthCm: 140,
  motorization: {
    somfy: {
      smallTrackMaxCm: 300,
      smallTrackPrice: 12500,
      largeTrackPrice: 16500,
    },
    generic: {
      smallTrackMaxCm: 300,
      smallTrackPrice: 7500,
      largeTrackPrice: 10500,
    },
  },
  wallpaper: {
    standardRollWidthFt: 1.74,
    standardRollLengthFt: 32.8,
    standardGrossAreaSqFt: 57.07,
    defaultCoverageSqFt: {
      plainTexture: 50,
      smallRepeat: 47,
      standardRepeat: 45,
      largeRepeat: 40,
    },
    installationRatePerSqFt: 20,
  },
  upholstery: {
    fabricMeters: {
      armchair_1_seater: 4.5,
      loveseat_2_seater: 8.5,
      sofa_3_seater: 12.0,
      sectional_5_seater: 20.0,
      dining_chair_seat_only: 0.8,
      dining_chair_full: 1.5,
      ottoman_footstool: 2.0,
      bed_headboard: 4.5,
    },
    baseLaborCharge: {
      armchair_1_seater: 1500,
      loveseat_2_seater: 2800,
      sofa_3_seater: 3800,
      sectional_5_seater: 6500,
      dining_chair_seat_only: 450,
      dining_chair_full: 850,
      ottoman_footstool: 1000,
      bed_headboard: 2800,
    },
    foamRatesPerSeat: {
      none: 0,
      standard_32_density: 1500,
      hd_40_density: 2500,
      latex_orthopedic_layer: 3800,
    },
  },
  defaultGstRatePercent: 18,
};
