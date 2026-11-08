import { describe, it, expect } from 'vitest';
import {
  calculateCurtainQuote,
  calculateWallpaperQuote,
  calculateUpholsteryQuote,
  calculateGST,
  generateNextInvoiceNumber,
} from '@/lib/pricing/calculator';
import {
  formatINR,
  toPaise,
  toRupees,
  generateInvoiceNumber,
  convertRupeesToWords,
} from '@/lib/utils';
import {
  CurtainConfig,
  WallpaperConfig,
  UpholsteryConfig,
  HeadingStyle,
  LiningType,
  FurnitureType,
  FoamGrade,
} from '@/types/measurement';
import { DEFAULT_RATE_CARD } from '@/config/rate-cards';

describe('Adversarial Stress Test: Curtain Pricing Engine', () => {
  it('handles zero and boundary dimensions strictly returning zero cost and integer paise', () => {
    const boundaryInputs: Array<{ track: number; drop: number; desc: string }> = [
      { track: 0, drop: 0, desc: 'Zero width and drop' },
      { track: 0, drop: 240, desc: 'Zero width with normal drop' },
      { track: 200, drop: 0, desc: 'Normal width with zero drop' },
      { track: -100, drop: 240, desc: 'Negative width' },
      { track: 200, drop: -100, desc: 'Negative drop' },
      { track: -200, drop: -300, desc: 'Both negative' },
    ];

    for (const input of boundaryInputs) {
      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm: input.track,
        dropLengthCm: input.drop,
        fullnessRatio: 2.0,
        headingStyle: 'eyelet',
        liningType: 'unlined',
        motorized: false,
        panels: 2,
      };

      const result = calculateCurtainQuote(config, 1000);

      expect(result.subtotalPaise, `Subtotal for ${input.desc} should be 0`).toBe(0);
      expect(result.fabricRequiredMeters, `Fabric meters for ${input.desc} should be 0`).toBe(0);
      expect(result.cutsNeeded, `Cuts for ${input.desc} should be 0`).toBe(0);
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
      expect(result.subtotalPaise >= 0).toBe(true);
    }
  });

  it('probes NaN dimensions in curtain calculations', () => {
    const nanConfig: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: NaN,
      dropLengthCm: 240,
      fullnessRatio: 2.0,
      headingStyle: 'eyelet',
      liningType: 'unlined',
      motorized: false,
      panels: 2,
    };
    const result = calculateCurtainQuote(nanConfig, 1000);
    expect(Number.isNaN(result.subtotalPaise), 'Curtain subtotal must not be NaN').toBe(false);
  });

  it('handles microscopic positive dimensions without NaN or negative values', () => {
    const microConfig: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 0.1,
      dropLengthCm: 0.1,
      fullnessRatio: 1.5,
      headingStyle: 'rod_pocket',
      liningType: 'unlined',
      motorized: false,
      panels: 1,
    };

    const result = calculateCurtainQuote(microConfig, 500);

    expect(Number.isInteger(result.subtotalPaise)).toBe(true);
    expect(result.subtotalPaise).toBeGreaterThan(0);
    expect(result.cutsNeeded).toBe(1); // Min 1 cut
    // Cut drop length = (0.1 + 25) / 100 = 0.251m -> rounded up to nearest 0.25m = 0.50m
    expect(result.fabricRequiredMeters).toBe(0.5);
    expect(result.fabricCostPaise).toBe(25000); // 0.5 * 500 * 100
  });

  it('calculates massive 50-meter commercial theater curtains without integer overflow', () => {
    // Commercial theater drape: 50 meters wide (5000 cm) x 15 meters high (1500 cm)
    const theaterConfig: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 5000,
      dropLengthCm: 1500,
      fullnessRatio: 2.5,
      headingStyle: 'box_pleat',
      liningType: 'blackout',
      motorized: true,
      motorBrand: 'somfy',
      panels: 2,
    };
    const fabricPricePerMeter = 3500; // Luxury velvet ₹3,500/m

    const result = calculateCurtainQuote(theaterConfig, fabricPricePerMeter);

    // 5000cm * 2.5 = 12500cm gathered width
    // 12500 / 140 = 89.28 -> 90 cuts
    expect(result.cutsNeeded).toBe(90);

    // Cut drop = (1500 + 25) / 100 = 15.25m
    expect(result.cutDropLengthMeters).toBe(15.25);

    // Raw meters = 90 * 15.25 = 1372.5m
    expect(result.fabricRequiredMeters).toBe(1372.5);

    // Costs
    expect(result.fabricCostPaise).toBe(1372.5 * 3500 * 100); // ₹48,03,750 = 480,375,000 paise
    expect(result.stitchingCostPaise).toBe(1372.5 * 300 * 100); // ₹4,11,750 = 41,175,000 paise
    expect(result.liningCostPaise).toBe(1372.5 * 350 * 100); // ₹4,80,375 = 48,037,500 paise
    // Surcharge: 40% of stitching cost = 41,175,000 * 0.40 = 16,470,000 paise
    expect(result.liningSurchargePaise).toBe(16470000);
    // Somfy large track (> 300cm) = ₹16,500 = 1,650,000 paise
    expect(result.motorCostPaise).toBe(1650000);

    const expectedTotal =
      480375000 + 41175000 + 48037500 + 16470000 + 1650000;
    expect(result.subtotalPaise).toBe(expectedTotal);
    expect(result.subtotalRupees).toBe(5877075); // ₹58,77,075

    // Safety checks
    expect(Number.isSafeInteger(result.subtotalPaise)).toBe(true);
    expect(Number.isInteger(result.subtotalPaise)).toBe(true);
    expect(Number.isNaN(result.subtotalPaise)).toBe(false);
  });

  it('verifies all 8 heading styles and all 5 lining types produce strictly integer paise', () => {
    const headingStyles: HeadingStyle[] = [
      'eyelet',
      'rod_pocket',
      'pinch_pleat_single',
      'pinch_pleat_double',
      'pinch_pleat_triple',
      'wave_s_fold',
      'box_pleat',
      'goblet_pleat',
    ];

    const liningTypes: LiningType[] = ['unlined', 'none', 'cotton', 'blackout', 'thermal'];

    for (const style of headingStyles) {
      for (const lining of liningTypes) {
        const config: CurtainConfig = {
          type: 'curtain',
          trackWidthCm: 235.5,
          dropLengthCm: 215.3,
          fullnessRatio: 2.1,
          headingStyle: style,
          liningType: lining,
          motorized: true,
          motorBrand: 'generic',
          panels: 2,
        };

        const result = calculateCurtainQuote(config, 1145.75);

        expect(Number.isInteger(result.fabricCostPaise)).toBe(true);
        expect(Number.isInteger(result.stitchingCostPaise)).toBe(true);
        expect(Number.isInteger(result.liningCostPaise)).toBe(true);
        expect(Number.isInteger(result.liningSurchargePaise)).toBe(true);
        expect(Number.isInteger(result.motorCostPaise)).toBe(true);
        expect(Number.isInteger(result.subtotalPaise)).toBe(true);
        expect(result.subtotalPaise).toBeGreaterThan(0);
        expect(Number.isNaN(result.subtotalPaise)).toBe(false);

        // Sum of parts equals subtotal
        const partsSum =
          result.fabricCostPaise +
          result.stitchingCostPaise +
          result.liningCostPaise +
          result.liningSurchargePaise +
          result.motorCostPaise;
        expect(result.subtotalPaise).toBe(partsSum);
      }
    }
  });
});

describe('Adversarial Stress Test: Wallpaper Pricing Engine', () => {
  it('handles zero dimensions strictly returning zero rolls and zero costs', () => {
    const zeroInputs = [
      { width: 0, height: 0 },
      { width: 0, height: 10 },
      { width: 12, height: 0 },
    ];

    for (const input of zeroInputs) {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: input.width,
        wallHeightFt: input.height,
        includeInstallation: true,
      };

      const result = calculateWallpaperQuote(config, 3000);
      expect(result.wallAreaSqFt).toBe(0);
      expect(result.rollsNeeded).toBe(0);
      expect(result.subtotalPaise).toBe(0);
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
    }
  });

  it('probes negative dimensions edge behavior in wallpaper calculator', () => {
    // If one dimension is negative:
    const negConfig1: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: -10,
      wallHeightFt: 10,
      includeInstallation: true,
    };
    const res1 = calculateWallpaperQuote(negConfig1, 2000);
    expect(res1.wallAreaSqFt).toBe(0);
    expect(res1.rollsNeeded).toBe(0);
    expect(res1.subtotalPaise).toBe(0);

    // If BOTH dimensions are negative:
    // Math.round((-10) * (-10) * 100) / 100 = 100 sq.ft!
    const negConfig2: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: -10,
      wallHeightFt: -10,
      includeInstallation: true,
    };
    const res2 = calculateWallpaperQuote(negConfig2, 2000);
    // VULNERABILITY TEST: Double-negative dimensions should NOT yield positive wall area or charges
    expect(res2.wallAreaSqFt, 'Double-negative dimensions must not calculate positive wall area').toBe(0);
    expect(res2.rollsNeeded, 'Double-negative dimensions must not calculate rolls needed').toBe(0);
    expect(res2.subtotalPaise, 'Double-negative dimensions must not charge customer').toBe(0);
  });

  it('tests resilience against NaN dimensions in wallpaper calculations', () => {
    const nanConfig: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: NaN,
      wallHeightFt: 10,
      includeInstallation: true,
    };
    const res = calculateWallpaperQuote(nanConfig, 2000);
    expect(Number.isNaN(res.subtotalPaise), 'Subtotal must not be NaN').toBe(false);
    expect(Number.isNaN(res.wallAreaSqFt), 'Wall area must not be NaN').toBe(false);
  });

  it('strictly verifies roll ceiling rounding (Math.ceil) across fractional coverage thresholds', () => {
    // Usable coverage for plain texture = 50 sq.ft
    const testCases: Array<{ width: number; height: number; expectedRolls: number }> = [
      { width: 5.0, height: 10.0, expectedRolls: 1 }, // exactly 50 sq.ft -> 1 roll
      { width: 5.001, height: 10.0, expectedRolls: 2 }, // 50.01 sq.ft -> 2 rolls
      { width: 5.1, height: 10.0, expectedRolls: 2 }, // 51 sq.ft -> 2 rolls
      { width: 9.99, height: 10.0, expectedRolls: 2 }, // 99.9 sq.ft -> 2 rolls
      { width: 10.0, height: 10.0, expectedRolls: 2 }, // exactly 100 sq.ft -> 2 rolls
      { width: 10.01, height: 10.0, expectedRolls: 3 }, // 100.1 sq.ft -> 3 rolls
    ];

    for (const tc of testCases) {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: tc.width,
        wallHeightFt: tc.height,
        patternRepeatCm: 0,
        patternRepeatType: 'none_free_match',
        includeInstallation: false,
      };

      const result = calculateWallpaperQuote(config, 2500);
      expect(result.rollsNeeded).toBe(tc.expectedRolls);
      expect(result.materialCostPaise).toBe(tc.expectedRolls * 2500 * 100);
    }
  });

  it('correctly maps pattern repeat match loss coverage across all 4 tiers', () => {
    // Wall 100 sq.ft
    const configs: Array<{
      repeatCm: number;
      repeatType: WallpaperConfig['patternRepeatType'];
      expectedCoverage: number;
      expectedRolls: number;
    }> = [
      { repeatCm: 0, repeatType: 'none_free_match', expectedCoverage: 50, expectedRolls: 2 }, // 100 / 50 = 2 rolls
      { repeatCm: 25, repeatType: 'straight_match', expectedCoverage: 47, expectedRolls: 3 }, // 100 / 47 = 2.12 -> 3 rolls
      { repeatCm: 53, repeatType: 'drop_match', expectedCoverage: 45, expectedRolls: 3 }, // 100 / 45 = 2.22 -> 3 rolls
      { repeatCm: 70, repeatType: 'drop_match', expectedCoverage: 40, expectedRolls: 3 }, // 100 / 40 = 2.5 -> 3 rolls
    ];

    for (const cfg of configs) {
      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: 10,
        wallHeightFt: 10,
        patternRepeatCm: cfg.repeatCm,
        patternRepeatType: cfg.repeatType,
        includeInstallation: true,
      };

      const result = calculateWallpaperQuote(config, 3000);
      expect(result.usableCoverageSqFt).toBe(cfg.expectedCoverage);
      expect(result.rollsNeeded).toBe(cfg.expectedRolls);
      expect(result.installationCostPaise).toBe(100 * 20 * 100); // 100 sq.ft * ₹20/sq.ft = ₹2,000
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
    }
  });

  it('handles massive commercial wall (500ft x 20ft) without numeric loss', () => {
    const config: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: 500,
      wallHeightFt: 20, // 10,000 sq.ft
      patternRepeatCm: 53,
      includeInstallation: true,
    };

    const result = calculateWallpaperQuote(config, 4200);

    expect(result.wallAreaSqFt).toBe(10000);
    // 10000 / 45 = 222.22 -> 223 rolls
    expect(result.rollsNeeded).toBe(223);
    expect(result.materialCostPaise).toBe(223 * 4200 * 100); // ₹9,36,600 = 93,660,000 paise
    expect(result.installationCostPaise).toBe(10000 * 20 * 100); // ₹2,00,000 = 20,000,000 paise
    expect(result.subtotalPaise).toBe(93660000 + 20000000); // 113,660,000 paise = ₹11,36,600
    expect(Number.isSafeInteger(result.subtotalPaise)).toBe(true);
  });
});

describe('Adversarial Stress Test: Upholstery Pricing Engine', () => {
  it('tests all 8 furniture types across various seat counts', () => {
    const furnitureTypes: FurnitureType[] = [
      'armchair_1_seater',
      'loveseat_2_seater',
      'sofa_3_seater',
      'sectional_5_seater',
      'dining_chair_seat_only',
      'dining_chair_full',
      'ottoman_footstool',
      'bed_headboard',
    ];

    for (const fType of furnitureTypes) {
      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: fType,
        seatCount: 4,
        includeFoamReplacement: true,
        foamGrade: 'standard_32_density',
      };

      const result = calculateUpholsteryQuote(config, 1500);

      expect(Number.isInteger(result.materialCostPaise)).toBe(true);
      expect(Number.isInteger(result.laborCostPaise)).toBe(true);
      expect(Number.isInteger(result.foamCostPaise)).toBe(true);
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(result.subtotalPaise).toBeGreaterThan(0);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
      expect(result.subtotalPaise).toBe(
        result.materialCostPaise + result.laborCostPaise + result.foamCostPaise
      );
    }
  });

  it('scales dining chairs linearly with seat count up to 100 seats', () => {
    for (const seats of [1, 6, 12, 50, 100]) {
      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: 'dining_chair_full',
        seatCount: seats,
        includeFoamReplacement: true,
        foamGrade: 'hd_40_density',
      };

      const result = calculateUpholsteryQuote(config, 2000);

      // baseMeters = 1.5m per chair
      const expectedMeters = Math.round(1.5 * seats * 10) / 10;
      expect(result.totalFabricMeters).toBe(expectedMeters);

      // baseLabor = 850 per chair
      expect(result.laborCostPaise).toBe(850 * seats * 100);

      // foam = 2500 per seat
      expect(result.foamCostPaise).toBe(2500 * seats * 100);

      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(result.subtotalPaise).toBe(
        result.materialCostPaise + result.laborCostPaise + result.foamCostPaise
      );
    }
  });

  it('respects customFabricMeters override regardless of furniture type', () => {
    const config: UpholsteryConfig = {
      type: 'upholstery',
      furnitureType: 'sofa_3_seater',
      seatCount: 3,
      customFabricMeters: 18.5, // Standard is 12m, override with 18.5m
      includeFoamReplacement: false,
      foamGrade: 'none',
    };

    const result = calculateUpholsteryQuote(config, 1000);

    expect(result.totalFabricMeters).toBe(18.5);
    expect(result.materialCostPaise).toBe(1850000); // 18.5 * 1000 * 100
    expect(result.laborCostPaise).toBe(3800 * 100); // Sofa 3-seater base labor ₹3,800
    expect(result.foamCostPaise).toBe(0);
    expect(result.subtotalPaise).toBe(1850000 + 380000);
  });

  it('handles boundary seat counts (zero, negative, undefined) safely', () => {
    const testCases: Array<Partial<UpholsteryConfig>> = [
      { seatCount: 0 },
      { seatCount: -5 },
      { seatCount: undefined },
    ];

    for (const tc of testCases) {
      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: 'armchair_1_seater',
        includeFoamReplacement: true,
        foamGrade: 'standard_32_density',
        ...tc,
      };

      const result = calculateUpholsteryQuote(config, 1000);
      expect(result.subtotalPaise).toBeGreaterThan(0);
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
    }
  });

  it('probes NaN and negative prices in upholstery calculations', () => {
    const config: UpholsteryConfig = {
      type: 'upholstery',
      furnitureType: 'armchair_1_seater',
      seatCount: 1,
    };
    const resNan = calculateUpholsteryQuote(config, NaN);
    expect(Number.isNaN(resNan.subtotalPaise), 'Upholstery subtotal must not be NaN').toBe(false);

    const resNeg = calculateUpholsteryQuote(config, -500);
    expect(resNeg.subtotalPaise >= 0, 'Upholstery subtotal must not be negative').toBe(true);
  });
});

describe('Adversarial Stress Test: GST Tax Splits (calculateGST)', () => {
  it('empirically verifies CGST + SGST === Total Tax exactly for 1000 random paise amounts with zero loss', () => {
    // Generate 1000 diverse random paise amounts (spanning odd, even, tiny, and large)
    const randomAmounts: number[] = [];

    // Specific tricky deterministic amounts
    randomAmounts.push(1); // 1 paisa
    randomAmounts.push(3); // 3 paise
    randomAmounts.push(5);
    randomAmounts.push(7);
    randomAmounts.push(11);
    randomAmounts.push(561);
    randomAmounts.push(999);
    randomAmounts.push(1001);
    randomAmounts.push(3333333);
    randomAmounts.push(99999999);

    // 990 pseudo-random amounts
    let seed = 42;
    function pseudoRandom(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let i = 0; i < 990; i++) {
      const amount = Math.floor(pseudoRandom() * 50000000) + 1; // 1 paisa to ₹5,00,000
      randomAmounts.push(amount);
    }

    let oddTotalTaxesCount = 0;

    for (const paise of randomAmounts) {
      const gst = calculateGST(paise, false, 18);

      // 1. Exact equality CGST + SGST === Total Tax
      expect(
        gst.cgstPaise + gst.sgstPaise,
        `Tax split sum mismatch for subtotal: ${paise}`
      ).toBe(gst.totalTaxPaise);

      // 2. Strict integer paise
      expect(Number.isInteger(gst.cgstPaise)).toBe(true);
      expect(Number.isInteger(gst.sgstPaise)).toBe(true);
      expect(Number.isInteger(gst.totalTaxPaise)).toBe(true);
      expect(Number.isNaN(gst.totalTaxPaise)).toBe(false);

      // 3. Difference between CGST and SGST can never exceed 1 paisa
      const diff = Math.abs(gst.cgstPaise - gst.sgstPaise);
      expect(diff).toBeLessThanOrEqual(1);

      // 4. IGST must be 0 for Intra-State
      expect(gst.igstPaise).toBe(0);

      // 5. Non-negative
      expect(gst.cgstPaise).toBeGreaterThanOrEqual(0);
      expect(gst.sgstPaise).toBeGreaterThanOrEqual(0);

      if (gst.totalTaxPaise % 2 !== 0) {
        oddTotalTaxesCount++;
        // Verify remainder allocated to SGST
        expect(gst.sgstPaise).toBe(gst.cgstPaise + 1);
      } else {
        expect(gst.cgstPaise).toBe(gst.sgstPaise);
      }
    }

    // Ensure we actually encountered odd paise cases in our 1000 sample set
    expect(oddTotalTaxesCount).toBeGreaterThan(100);
  });

  it('empirically verifies Inter-State IGST allocates 100% with zero CGST/SGST for 1000 random amounts', () => {
    let seed = 12345;
    function pseudoRandom(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let i = 0; i < 1000; i++) {
      const amount = Math.floor(pseudoRandom() * 50000000) + 1;
      const gst = calculateGST(amount, true, 18);

      expect(gst.isInterState).toBe(true);
      expect(gst.igstPaise).toBe(gst.totalTaxPaise);
      expect(gst.cgstPaise).toBe(0);
      expect(gst.sgstPaise).toBe(0);
      expect(Number.isInteger(gst.igstPaise)).toBe(true);
      expect(gst.igstPaise).toBeGreaterThanOrEqual(0);
    }
  });

  it('tests boundary tax rates (0%, 5%, 12%, 18%, 28%) and negative inputs', () => {
    const rates = [0, 5, 12, 18, 28];
    for (const rate of rates) {
      const gst = calculateGST(100000, false, rate);
      expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
      expect(Number.isInteger(gst.totalTaxPaise)).toBe(true);
    }

    // Negative subtotal
    const negGst = calculateGST(-5000, false, 18);
    expect(negGst.totalTaxPaise).toBe(0);
    expect(negGst.cgstPaise).toBe(0);
    expect(negGst.sgstPaise).toBe(0);

    // NaN subtotal
    const nanGst = calculateGST(NaN, false, 18);
    expect(Number.isNaN(nanGst.totalTaxPaise), 'GST total tax must not be NaN').toBe(false);
  });
});

describe('Adversarial Stress Test: Currency & Localization Invariants', () => {
  it('verifies toPaise and toRupees are lossless inverse operations on 2-decimal floats', () => {
    const testValues = [0, 0.01, 0.99, 1.5, 49.99, 1250.75, 99999.99, 1500000.5];
    for (const val of testValues) {
      const paise = toPaise(val);
      expect(Number.isInteger(paise)).toBe(true);
      const roundtripRupees = toRupees(paise);
      expect(roundtripRupees).toBe(val);
    }
  });

  it('formats extreme Rupee figures with correct Indian currency grouping and symbols', () => {
    expect(formatINR(0)).toContain('₹0');
    expect(formatINR(1000)).toContain('1,000');
    expect(formatINR(100000)).toContain('1,00,000'); // 1 Lakh
    expect(formatINR(10000000)).toContain('1,00,00,000'); // 1 Crore
    expect(formatINR(500000000)).toContain('50,00,00,000'); // 50 Crores

    // From paise
    expect(formatINR(10000000, true)).toContain('1,00,000'); // 1 Lakh from 1 Crore paise
  });

  it('tests invoice numbering sequence roll-up and boundaries', () => {
    expect(generateInvoiceNumber(1, 2026)).toBe('EF-2026-00001');
    expect(generateInvoiceNumber(9999, 2026)).toBe('EF-2026-09999');
    expect(generateInvoiceNumber(10000, 2026)).toBe('EF-2026-10000');
    expect(generateInvoiceNumber(-5, 2026)).toBe('EF-2026-00001'); // Negative clamped

    expect(generateNextInvoiceNumber('EF-2026-00009', 2026)).toBe('EF-2026-00010');
    expect(generateNextInvoiceNumber('EF-2026-99999', 2026)).toBe('EF-2026-100000');
    expect(generateNextInvoiceNumber('invalid-string', 2026)).toBe('EF-2026-00001');
  });
});

describe('Adversarial Property-Based Fuzz Testing (Invariants Across Randomized Inputs)', () => {
  let rngSeed = 987654321;
  function lcg(): number {
    rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296;
    return rngSeed / 4294967296;
  }

  it('fuzzes CurtainQuote across 1,000 pseudo-random configurations verifying invariants', () => {
    const headingStyles: HeadingStyle[] = [
      'eyelet',
      'rod_pocket',
      'pinch_pleat_single',
      'pinch_pleat_double',
      'pinch_pleat_triple',
      'wave_s_fold',
      'box_pleat',
      'goblet_pleat',
    ];
    const liningTypes: LiningType[] = ['unlined', 'none', 'cotton', 'blackout', 'thermal'];

    for (let i = 0; i < 1000; i++) {
      const trackWidthCm = lcg() * 3000; // 0 to 30 meters
      const dropLengthCm = lcg() * 1500; // 0 to 15 meters
      const fullnessRatio = 1.0 + lcg() * 2.5; // 1.0 to 3.5
      const headingStyle = headingStyles[Math.floor(lcg() * headingStyles.length)];
      const liningType = liningTypes[Math.floor(lcg() * liningTypes.length)];
      const motorized = lcg() > 0.5;
      const motorBrand = lcg() > 0.5 ? 'somfy' : 'generic';
      const fabricPrice = Math.floor(lcg() * 5000) + 150; // ₹150 to ₹5,150

      const config: CurtainConfig = {
        type: 'curtain',
        trackWidthCm,
        dropLengthCm,
        fullnessRatio,
        headingStyle,
        liningType,
        motorized,
        motorBrand,
        panels: 2,
      };

      const result = calculateCurtainQuote(config, fabricPrice);

      // Invariants:
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
      expect(result.subtotalPaise).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.fabricCostPaise)).toBe(true);
      expect(Number.isInteger(result.stitchingCostPaise)).toBe(true);
      expect(Number.isInteger(result.liningCostPaise)).toBe(true);
      expect(Number.isInteger(result.liningSurchargePaise)).toBe(true);
      expect(Number.isInteger(result.motorCostPaise)).toBe(true);
      expect(result.subtotalPaise).toBe(
        result.fabricCostPaise +
          result.stitchingCostPaise +
          result.liningCostPaise +
          result.liningSurchargePaise +
          result.motorCostPaise
      );
      expect(result.subtotalRupees).toBe(result.subtotalPaise / 100);
      expect(result.breakdown.subtotalPaise).toBe(result.subtotalPaise);
    }
  });

  it('fuzzes WallpaperQuote across 1,000 pseudo-random configurations verifying invariants', () => {
    const repeatTypes: WallpaperConfig['patternRepeatType'][] = [
      'none_free_match',
      'straight_match',
      'drop_match',
      'random_match',
    ];

    for (let i = 0; i < 1000; i++) {
      const width = lcg() * 200; // 0 to 200 ft
      const height = lcg() * 30; // 0 to 30 ft
      const patternRepeatCm = Math.floor(lcg() * 100);
      const repeatType = repeatTypes[Math.floor(lcg() * repeatTypes.length)];
      const includeInstallation = lcg() > 0.5;
      const rollPrice = Math.floor(lcg() * 8000) + 800; // ₹800 to ₹8,800

      const config: WallpaperConfig = {
        type: 'wallpaper',
        wallWidthFt: width,
        wallHeightFt: height,
        patternRepeatCm,
        patternRepeatType: repeatType,
        includeInstallation,
      };

      const result = calculateWallpaperQuote(config, rollPrice);

      // Invariants:
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
      expect(result.subtotalPaise).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.materialCostPaise)).toBe(true);
      expect(Number.isInteger(result.installationCostPaise)).toBe(true);
      expect(result.subtotalPaise).toBe(
        result.materialCostPaise + result.installationCostPaise
      );
      expect(result.subtotalRupees).toBe(result.subtotalPaise / 100);
      if (result.wallAreaSqFt > 0) {
        expect(result.rollsNeeded).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('fuzzes UpholsteryQuote across 1,000 pseudo-random configurations verifying invariants', () => {
    const furnitureTypes: FurnitureType[] = [
      'armchair_1_seater',
      'loveseat_2_seater',
      'sofa_3_seater',
      'sectional_5_seater',
      'dining_chair_seat_only',
      'dining_chair_full',
      'ottoman_footstool',
      'bed_headboard',
    ];
    const foamGrades: FoamGrade[] = [
      'none',
      'standard_32_density',
      'hd_40_density',
      'latex_orthopedic_layer',
    ];

    for (let i = 0; i < 1000; i++) {
      const fType = furnitureTypes[Math.floor(lcg() * furnitureTypes.length)];
      const seatCount = Math.floor(lcg() * 20) + 1; // 1 to 20 seats
      const foamGrade = foamGrades[Math.floor(lcg() * foamGrades.length)];
      const includeFoam = lcg() > 0.5;
      const customMeters = lcg() > 0.8 ? Math.round(lcg() * 30 * 10) / 10 : undefined;
      const fabricPrice = Math.floor(lcg() * 4000) + 300;

      const config: UpholsteryConfig = {
        type: 'upholstery',
        furnitureType: fType,
        seatCount,
        foamGrade,
        includeFoamReplacement: includeFoam,
        customFabricMeters: customMeters,
      };

      const result = calculateUpholsteryQuote(config, fabricPrice);

      // Invariants:
      expect(Number.isInteger(result.subtotalPaise)).toBe(true);
      expect(Number.isNaN(result.subtotalPaise)).toBe(false);
      expect(result.subtotalPaise).toBeGreaterThan(0);
      expect(Number.isInteger(result.materialCostPaise)).toBe(true);
      expect(Number.isInteger(result.laborCostPaise)).toBe(true);
      expect(Number.isInteger(result.foamCostPaise)).toBe(true);
      expect(result.subtotalPaise).toBe(
        result.materialCostPaise + result.laborCostPaise + result.foamCostPaise
      );
      expect(result.subtotalRupees).toBe(result.subtotalPaise / 100);
    }
  });

  it('empirically checks convertRupeesToWords boundary at high amounts', () => {
    expect(convertRupeesToWords(100)).toBe('Rupees One Hundred Only');
    expect(convertRupeesToWords(55555)).toBe('Rupees Fifty Five Thousand Five Hundred Fifty Five Only');
    expect(convertRupeesToWords(10000000)).toBe('Rupees One Crore Only');
    expect(convertRupeesToWords(990000000)).toBe('Rupees Ninety Nine Crore Only');
    // Probe 100 Crore (1 Billion INR)
    const words100Cr = convertRupeesToWords(1000000000);
    expect(words100Cr.includes('undefined'), 'convertRupeesToWords must not contain "undefined"').toBe(false);
  });
});

