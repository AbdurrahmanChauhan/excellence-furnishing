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
import { CurtainConfig, WallpaperConfig, UpholsteryConfig } from '@/types/measurement';
import { DEFAULT_RATE_CARD } from '@/config/rate-cards';

describe('Pricing Engine: Curtains (calculateCurtainQuote)', () => {
  it('calculates standard eyelet curtain with unlined backing correctly', () => {
    const config: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 200,
      dropLengthCm: 240,
      fullnessRatio: 2.0,
      headingStyle: 'eyelet',
      liningType: 'unlined',
      motorized: false,
      panels: 2,
    };
    const fabricPricePerMeter = 850; // ₹850/m

    const result = calculateCurtainQuote(config, fabricPricePerMeter);

    // Track 200cm * 2.0 fullness = 400cm gathered width
    // 400cm / 140cm bolt = ceil(2.857) = 3 cuts
    expect(result.cutsNeeded).toBe(3);
    // Cut drop = (240 + 25cm hem) / 100 = 2.65m
    expect(result.cutDropLengthMeters).toBe(2.65);
    // Raw meters = 3 * 2.65 = 7.95m -> ceil to nearest 0.25m = 8.0m
    expect(result.fabricRequiredMeters).toBe(8.0);

    // Fabric cost = 8m * ₹850 = ₹6,800 = 680,000 paise
    expect(result.fabricCostPaise).toBe(680000);
    // Stitching cost = 8m * ₹150 (eyelet rate) = ₹1,200 = 120,000 paise
    expect(result.stitchingCostPaise).toBe(120000);
    // Unlined -> 0
    expect(result.liningCostPaise).toBe(0);
    expect(result.liningSurchargePaise).toBe(0);
    expect(result.motorCostPaise).toBe(0);

    expect(result.subtotalPaise).toBe(680000 + 120000);
    expect(result.subtotalRupees).toBe(8000);
  });

  it('calculates wave/s-fold drapes with blackout lining and 40% tailoring surcharge', () => {
    const config: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 280,
      dropLengthCm: 260,
      fullnessRatio: 2.0,
      headingStyle: 'wave_s_fold',
      liningType: 'blackout',
      motorized: false,
      panels: 2,
    };
    const fabricPricePerMeter = 2200;

    const result = calculateCurtainQuote(config, fabricPricePerMeter);

    // 280 * 2 = 560cm -> 560 / 140 = 4 cuts
    expect(result.cutsNeeded).toBe(4);
    // Drop: (260 + 25) / 100 = 2.85m
    // Raw meters = 4 * 2.85 = 11.4m -> ceil to nearest 0.25m = 11.5m
    expect(result.fabricRequiredMeters).toBe(11.5);

    // Fabric: 11.5 * 2200 = ₹25,300 = 2,530,000 paise
    expect(result.fabricCostPaise).toBe(2530000);
    // Stitching: 11.5 * 280 = ₹3,220 = 322,000 paise
    expect(result.stitchingCostPaise).toBe(322000);
    // Lining: 11.5 * 350 = ₹4,025 = 402,500 paise
    expect(result.liningCostPaise).toBe(402500);
    // Surcharge: 40% of 322,000 paise = 128,800 paise (₹1,288)
    expect(result.liningSurchargePaise).toBe(128800);

    const expectedSubtotalPaise = 2530000 + 322000 + 402500 + 128800;
    expect(result.subtotalPaise).toBe(expectedSubtotalPaise);
  });

  it('calculates Somfy motorization correctly for small and large tracks', () => {
    const smallTrackConfig: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 250, // <= 300cm
      dropLengthCm: 240,
      fullnessRatio: 2.0,
      headingStyle: 'eyelet',
      liningType: 'unlined',
      motorized: true,
      motorBrand: 'somfy',
      panels: 2,
    };
    const smallResult = calculateCurtainQuote(smallTrackConfig, 1000);
    expect(smallResult.motorCostPaise).toBe(1250000); // ₹12,500

    const largeTrackConfig: CurtainConfig = {
      ...smallTrackConfig,
      trackWidthCm: 350, // > 300cm
    };
    const largeResult = calculateCurtainQuote(largeTrackConfig, 1000);
    expect(largeResult.motorCostPaise).toBe(1650000); // ₹16,500
  });

  it('handles edge case of zero or negative dimensions gracefully', () => {
    const zeroConfig: CurtainConfig = {
      type: 'curtain',
      trackWidthCm: 0,
      dropLengthCm: 0,
      fullnessRatio: 2.0,
      headingStyle: 'eyelet',
      liningType: 'unlined',
      motorized: false,
      panels: 1,
    };
    const result = calculateCurtainQuote(zeroConfig, 1000);
    expect(result.subtotalPaise).toBe(0);
    expect(result.fabricRequiredMeters).toBe(0);
  });
});

describe('Pricing Engine: Wallpaper (calculateWallpaperQuote)', () => {
  it('calculates rolls needed with ceiling rounding and installation labor', () => {
    const config: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: 14,
      wallHeightFt: 10, // 140 sq.ft
      patternRepeatCm: 0,
      patternRepeatType: 'none_free_match',
      includeInstallation: true,
    };
    const rollPrice = 2500; // ₹2,500/roll

    const result = calculateWallpaperQuote(config, rollPrice);

    expect(result.wallAreaSqFt).toBe(140);
    // Plain texture usable coverage = 50 sq.ft
    expect(result.usableCoverageSqFt).toBe(50);
    // 140 / 50 = 2.8 -> ceil to 3 rolls
    expect(result.rollsNeeded).toBe(3);
    // Material cost = 3 * 2500 = ₹7,500 = 750,000 paise
    expect(result.materialCostPaise).toBe(750000);
    // Installation: 140 * ₹20/sq.ft = ₹2,800 = 280,000 paise
    expect(result.installationCostPaise).toBe(280000);
    expect(result.subtotalPaise).toBe(1030000);
    expect(result.subtotalRupees).toBe(10300);
  });

  it('handles standard pattern repeat match loss and excludes installation when unchecked', () => {
    const config: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: 14,
      wallHeightFt: 10, // 140 sq.ft
      patternRepeatCm: 53,
      includeInstallation: false,
    };
    const rollPrice = 3400;

    const result = calculateWallpaperQuote(config, rollPrice);

    // Standard repeat coverage = 45 sq.ft
    expect(result.usableCoverageSqFt).toBe(45);
    // 140 / 45 = 3.111 -> ceil to 4 rolls (never rounds down)
    expect(result.rollsNeeded).toBe(4);
    expect(result.materialCostPaise).toBe(4 * 3400 * 100);
    expect(result.installationCostPaise).toBe(0);
    expect(result.subtotalPaise).toBe(1360000);
  });

  it('handles zero wall dimensions without crashing', () => {
    const config: WallpaperConfig = {
      type: 'wallpaper',
      wallWidthFt: 0,
      wallHeightFt: 0,
      includeInstallation: true,
    };
    const result = calculateWallpaperQuote(config, 2000);
    expect(result.wallAreaSqFt).toBe(0);
    expect(result.rollsNeeded).toBe(0);
    expect(result.subtotalPaise).toBe(0);
  });
});

describe('Pricing Engine: Sofa Upholstery (calculateUpholsteryQuote)', () => {
  it('calculates 3-seater sofa reupholstery with HD foam replacement', () => {
    const config: UpholsteryConfig = {
      type: 'upholstery',
      furnitureType: 'sofa_3_seater',
      seatCount: 3,
      includeFoamReplacement: true,
      foamGrade: 'hd_40_density',
    };
    const fabricPricePerMeter = 1650; // ₹1,650/m

    const result = calculateUpholsteryQuote(config, fabricPricePerMeter);

    // Standard 3-seater fabric = 12.0m
    expect(result.totalFabricMeters).toBe(12.0);
    // Material = 12 * 1650 = ₹19,800 = 1,980,000 paise
    expect(result.materialCostPaise).toBe(1980000);
    // Labor = ₹3,800 = 380,000 paise
    expect(result.laborCostPaise).toBe(380000);
    // Foam = 3 seats * ₹2,500 = ₹7,500 = 750,000 paise
    expect(result.foamCostPaise).toBe(750000);

    expect(result.subtotalPaise).toBe(1980000 + 380000 + 750000);
    expect(result.subtotalRupees).toBe(31100);
  });

  it('scales dining chairs fabric and labor linearly with seat count', () => {
    const config: UpholsteryConfig = {
      type: 'upholstery',
      furnitureType: 'dining_chair_seat_only',
      seatCount: 6,
      includeFoamReplacement: false,
      foamGrade: 'none',
    };
    const fabricPrice = 1200;

    const result = calculateUpholsteryQuote(config, fabricPrice);

    // 6 * 0.8m = 4.8m
    expect(result.totalFabricMeters).toBe(4.8);
    // 6 * ₹450 = ₹2,700 = 270,000 paise
    expect(result.laborCostPaise).toBe(270000);
    expect(result.foamCostPaise).toBe(0);
  });
});

describe('Finance: GST Engine (calculateGST)', () => {
  it('splits intra-state GST evenly (50% CGST + 50% SGST) with zero loss on odd paise', () => {
    // 561 paise @ 18% = 100.98 -> 101 paise total tax
    const subtotalPaise = 561;
    const gst = calculateGST(subtotalPaise, false, 18);

    expect(gst.isInterState).toBe(false);
    expect(gst.totalTaxPaise).toBe(101);
    expect(gst.cgstPaise).toBe(50);
    expect(gst.sgstPaise).toBe(51);
    expect(gst.igstPaise).toBe(0);
    expect(gst.cgstPaise + gst.sgstPaise).toBe(gst.totalTaxPaise);
  });

  it('allocates 100% to IGST for inter-state supply', () => {
    const subtotalPaise = 100000; // ₹1,000
    const gst = calculateGST(subtotalPaise, true, 18);

    expect(gst.isInterState).toBe(true);
    expect(gst.totalTaxPaise).toBe(18000); // ₹180
    expect(gst.cgstPaise).toBe(0);
    expect(gst.sgstPaise).toBe(0);
    expect(gst.igstPaise).toBe(18000);
  });

  it('handles 0 subtotal without error', () => {
    const gst = calculateGST(0, false, 18);
    expect(gst.totalTaxPaise).toBe(0);
    expect(gst.cgstPaise).toBe(0);
    expect(gst.sgstPaise).toBe(0);
  });
});

describe('Invoice Number Generator', () => {
  it('generates EF-2026-00001 when no previous invoice exists', () => {
    expect(generateNextInvoiceNumber(null, 2026)).toBe('EF-2026-00001');
    expect(generateInvoiceNumber(1, 2026)).toBe('EF-2026-00001');
  });

  it('increments sequential numbers correctly', () => {
    expect(generateNextInvoiceNumber('EF-2026-00042', 2026)).toBe('EF-2026-00043');
    expect(generateNextInvoiceNumber('EF-2026-00099', 2026)).toBe('EF-2026-00100');
  });

  it('rolls over to new fiscal year prefix when calendar year changes', () => {
    expect(generateNextInvoiceNumber('EF-2025-00120', 2026)).toBe('EF-2026-00001');
  });
});

describe('Localization & Currency Utilities (src/lib/utils.ts)', () => {
  it('formats Indian Rupees with proper Lakh/Crore grouping and ₹ symbol', () => {
    const formatted1 = formatINR(125000);
    expect(formatted1).toContain('1,25,000');
    expect(formatted1).toContain('₹');

    const formattedCrores = formatINR(14500000);
    expect(formattedCrores).toContain('1,45,00,000');

    // From paise
    const fromPaise = formatINR(12500000, true);
    expect(fromPaise).toContain('1,25,000');
  });

  it('converts Rupee numbers to official Indian English words', () => {
    expect(convertRupeesToWords(125000)).toBe('Rupees One Lakh Twenty Five Thousand Only');
    expect(convertRupeesToWords(14500000)).toBe('Rupees One Crore Forty Five Lakh Only');
    expect(convertRupeesToWords(0)).toBe('Rupees Zero Only');
  });

  it('converts between paise and rupees accurately', () => {
    expect(toPaise(1500.5)).toBe(150050);
    expect(toRupees(150050)).toBe(1500.5);
  });
});
