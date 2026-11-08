import {
  CurtainConfig,
  WallpaperConfig,
  UpholsteryConfig,
  MeasurementBreakdown,
  ItemizedCost,
} from '@/types/measurement';
import { GSTBreakdown, Paise, Rupee } from '@/types/common';
import { DEFAULT_RATE_CARD, RateCard } from '@/config/rate-cards';

export interface QuoteResultBase {
  readonly subtotalPaise: Paise;
  readonly subtotalRupees: Rupee;
  readonly breakdown: MeasurementBreakdown;
}

export interface CurtainQuoteResult extends QuoteResultBase {
  readonly fabricRequiredMeters: number;
  readonly cutsNeeded: number;
  readonly cutDropLengthMeters: number;
  readonly fabricCostPaise: Paise;
  readonly stitchingCostPaise: Paise;
  readonly liningCostPaise: Paise;
  readonly liningSurchargePaise: Paise;
  readonly motorCostPaise: Paise;
}

export interface WallpaperQuoteResult extends QuoteResultBase {
  readonly wallAreaSqFt: number;
  readonly rollsNeeded: number;
  readonly usableCoverageSqFt: number;
  readonly materialCostPaise: Paise;
  readonly installationCostPaise: Paise;
}

export interface UpholsteryQuoteResult extends QuoteResultBase {
  readonly totalFabricMeters: number;
  readonly materialCostPaise: Paise;
  readonly laborCostPaise: Paise;
  readonly foamCostPaise: Paise;
}

/**
 * Calculates a bespoke curtain quote based on track dimensions, pleating, lining, and motorization.
 * 
 * Formula:
 * 1. Gathered Width = trackWidthCm * fullnessRatio
 * 2. Cuts Needed = ceil(Gathered Width / fabricWidthCm) (min 1 cut)
 * 3. Cut Drop Length = (dropLengthCm + hemAllowanceCm) / 100 meters
 * 4. Raw Fabric Meters = Cuts Needed * Cut Drop Length
 * 5. Rounded Fabric Meters = ceil(Raw Meters * 4) / 4 (nearest 0.25m buffer)
 * 6. Fabric Cost = Rounded Meters * fabricPricePerMeter
 * 7. Stitching Cost = Rounded Meters * headingStyleRate
 * 8. Lining Cost = liningType !== 'none' ? Rounded Meters * liningRate : 0
 * 9. Lining Surcharge = liningType !== 'none' ? 40% of Stitching Cost : 0
 * 10. Motor Cost = motorized ? motorPrice based on track width : 0
 */
export function calculateCurtainQuote(
  config: CurtainConfig,
  fabricPricePerMeter: number,
  rateCard: RateCard = DEFAULT_RATE_CARD
): CurtainQuoteResult {
  if (
    !Number.isFinite(config.trackWidthCm) ||
    config.trackWidthCm <= 0 ||
    !Number.isFinite(config.dropLengthCm) ||
    config.dropLengthCm <= 0 ||
    !Number.isFinite(fabricPricePerMeter) ||
    fabricPricePerMeter <= 0
  ) {
    const emptyBreakdown: MeasurementBreakdown = {
      fabricRequiredMeters: 0,
      materialCostPaise: 0,
      stitchingCostPaise: 0,
      liningCostPaise: 0,
      liningSurchargePaise: 0,
      motorCostPaise: 0,
      subtotalPaise: 0,
      itemizedSummary: [],
    };
    return {
      fabricRequiredMeters: 0,
      cutsNeeded: 0,
      cutDropLengthMeters: 0,
      fabricCostPaise: 0,
      stitchingCostPaise: 0,
      liningCostPaise: 0,
      liningSurchargePaise: 0,
      motorCostPaise: 0,
      subtotalPaise: 0,
      subtotalRupees: 0,
      breakdown: emptyBreakdown,
    };
  }

  const fabricWidthCm = config.fabricWidthCm || rateCard.defaultFabricWidthCm;
  const gatheredWidth = config.trackWidthCm * config.fullnessRatio;
  const rawCuts = Math.ceil(gatheredWidth / fabricWidthCm);
  const cutsNeeded = Math.max(1, rawCuts);

  const cutDropLengthMeters = (config.dropLengthCm + rateCard.hemAllowanceCm) / 100;
  const rawMeters = cutsNeeded * cutDropLengthMeters;
  // Round up to nearest 0.25 meters for cutting buffer
  const fabricRequiredMeters = Math.ceil(rawMeters * 4) / 4;

  // Costs in Integer Paise (1 INR = 100 Paise)
  const fabricCostPaise = Math.round(fabricRequiredMeters * fabricPricePerMeter * 100);

  const stitchingRate = rateCard.stitchingRates[config.headingStyle] ?? 150;
  const stitchingCostPaise = Math.round(fabricRequiredMeters * stitchingRate * 100);

  const isLined = config.liningType && config.liningType !== 'none' && config.liningType !== 'unlined';
  let liningCostPaise = 0;
  let liningSurchargePaise = 0;

  if (isLined) {
    const liningRate = rateCard.liningRates[config.liningType] ?? 0;
    liningCostPaise = Math.round(fabricRequiredMeters * liningRate * 100);
    liningSurchargePaise = Math.round(stitchingCostPaise * rateCard.liningSurchargePercent);
  }

  let motorCostPaise = 0;
  if (config.motorized) {
    const isSomfy = config.motorBrand === 'somfy';
    const motorRates = isSomfy ? rateCard.motorization.somfy : rateCard.motorization.generic;
    const motorRateRupees =
      config.trackWidthCm <= motorRates.smallTrackMaxCm
        ? motorRates.smallTrackPrice
        : motorRates.largeTrackPrice;
    motorCostPaise = Math.round(motorRateRupees * 100);
  }

  const subtotalPaise =
    fabricCostPaise +
    stitchingCostPaise +
    liningCostPaise +
    liningSurchargePaise +
    motorCostPaise;

  const itemizedSummary: ItemizedCost[] = [
    {
      label: `Fabric (${fabricRequiredMeters}m @ ₹${fabricPricePerMeter}/m)`,
      amountPaise: fabricCostPaise,
    },
    {
      label: `Tailoring & Heading (${config.headingStyle.replace(/_/g, ' ')}, ${fabricRequiredMeters}m)`,
      amountPaise: stitchingCostPaise,
    },
  ];

  if (liningCostPaise > 0) {
    itemizedSummary.push({
      label: `Lining Fabric (${config.liningType})`,
      amountPaise: liningCostPaise,
    });
  }

  if (liningSurchargePaise > 0) {
    itemizedSummary.push({
      label: `Dual-Layer Stitching Surcharge (40%)`,
      amountPaise: liningSurchargePaise,
    });
  }

  if (motorCostPaise > 0) {
    itemizedSummary.push({
      label: `Motorization (${config.motorBrand === 'somfy' ? 'Somfy Motorized Track' : 'Standard Motorized Track'})`,
      amountPaise: motorCostPaise,
    });
  }

  const breakdown: MeasurementBreakdown = {
    fabricRequiredMeters,
    materialCostPaise: fabricCostPaise,
    stitchingCostPaise,
    liningCostPaise,
    liningSurchargePaise,
    motorCostPaise,
    subtotalPaise,
    itemizedSummary,
  };

  return {
    fabricRequiredMeters,
    cutsNeeded,
    cutDropLengthMeters,
    fabricCostPaise,
    stitchingCostPaise,
    liningCostPaise,
    liningSurchargePaise,
    motorCostPaise,
    subtotalPaise,
    subtotalRupees: subtotalPaise / 100,
    breakdown,
  };
}

/**
 * Calculates wallpaper roll requirements and quote based on wall area and pattern repeat match allowance.
 * 
 * Formula:
 * 1. Wall Area = wallWidthFt * wallHeightFt
 * 2. Usable Coverage = 50 sq.ft (plain), 47 sq.ft (small repeat), 45 sq.ft (standard), 40 sq.ft (large repeat)
 * 3. Rolls Needed = ceil(Wall Area / Usable Coverage)
 * 4. Material Cost = Rolls Needed * rollPrice
 * 5. Installation Cost = Wall Area * installationRatePerSqFt (if included)
 */
export function calculateWallpaperQuote(
  config: WallpaperConfig,
  rollPrice: number,
  rateCard: RateCard = DEFAULT_RATE_CARD
): WallpaperQuoteResult {
  if (
    !Number.isFinite(config.wallWidthFt) ||
    config.wallWidthFt <= 0 ||
    !Number.isFinite(config.wallHeightFt) ||
    config.wallHeightFt <= 0 ||
    !Number.isFinite(rollPrice) ||
    rollPrice <= 0
  ) {
    const emptyBreakdown: MeasurementBreakdown = {
      totalAreaSqFt: 0,
      rollsRequired: 0,
      materialCostPaise: 0,
      installationCostPaise: 0,
      subtotalPaise: 0,
      itemizedSummary: [],
    };
    return {
      wallAreaSqFt: 0,
      rollsNeeded: 0,
      usableCoverageSqFt: 0,
      materialCostPaise: 0,
      installationCostPaise: 0,
      subtotalPaise: 0,
      subtotalRupees: 0,
      breakdown: emptyBreakdown,
    };
  }

  const wallAreaSqFt = Math.max(0, Math.round(config.wallWidthFt * config.wallHeightFt * 100) / 100);

  let usableCoverage = config.usableCoverageSqFtPerRoll;
  if (!usableCoverage) {
    if (config.patternRepeatType === 'none_free_match' || config.patternRepeatCm === 0) {
      usableCoverage = rateCard.wallpaper.defaultCoverageSqFt.plainTexture;
    } else if (config.patternRepeatType === 'straight_match' || (config.patternRepeatCm && config.patternRepeatCm <= 30)) {
      usableCoverage = rateCard.wallpaper.defaultCoverageSqFt.smallRepeat;
    } else if (config.patternRepeatCm && config.patternRepeatCm > 64) {
      usableCoverage = rateCard.wallpaper.defaultCoverageSqFt.largeRepeat;
    } else {
      usableCoverage = rateCard.wallpaper.defaultCoverageSqFt.standardRepeat;
    }
  }

  const rollsNeeded = Math.ceil(wallAreaSqFt / usableCoverage);
  const materialCostPaise = Math.round(rollsNeeded * rollPrice * 100);

  const installationCostPaise = config.includeInstallation
    ? Math.round(wallAreaSqFt * rateCard.wallpaper.installationRatePerSqFt * 100)
    : 0;

  const subtotalPaise = materialCostPaise + installationCostPaise;

  const itemizedSummary: ItemizedCost[] = [
    {
      label: `Wallpaper Rolls (${rollsNeeded} roll${rollsNeeded === 1 ? '' : 's'} @ ₹${rollPrice}/roll)`,
      amountPaise: materialCostPaise,
    },
  ];

  if (installationCostPaise > 0) {
    itemizedSummary.push({
      label: `Professional Installation (${wallAreaSqFt} sq.ft @ ₹${rateCard.wallpaper.installationRatePerSqFt}/sq.ft)`,
      amountPaise: installationCostPaise,
    });
  }

  const breakdown: MeasurementBreakdown = {
    totalAreaSqFt: wallAreaSqFt,
    rollsRequired: rollsNeeded,
    materialCostPaise,
    installationCostPaise,
    subtotalPaise,
    itemizedSummary,
  };

  return {
    wallAreaSqFt,
    rollsNeeded,
    usableCoverageSqFt: usableCoverage,
    materialCostPaise,
    installationCostPaise,
    subtotalPaise,
    subtotalRupees: subtotalPaise / 100,
    breakdown,
  };
}

/**
 * Calculates sofa reupholstery quote based on furniture configuration, seat count, and foam revitalisation.
 * 
 * Formula:
 * 1. Total Fabric Meters = customFabricMeters || (furnitureFabricMeters * seatMultiplier)
 * 2. Fabric Cost = Total Fabric Meters * fabricPricePerMeter
 * 3. Labor Cost = baseLaborCharge (scaled by seat count if non-standard)
 * 4. Foam Cost = includeFoamReplacement ? seatCount * foamRatePerSeat : 0
 */
export function calculateUpholsteryQuote(
  config: UpholsteryConfig,
  fabricPricePerMeter: number,
  rateCard: RateCard = DEFAULT_RATE_CARD
): UpholsteryQuoteResult {
  if (!Number.isFinite(fabricPricePerMeter) || fabricPricePerMeter < 0) {
    const emptyBreakdown: MeasurementBreakdown = {
      fabricRequiredMeters: 0,
      materialCostPaise: 0,
      laborCostPaise: 0,
      foamCostPaise: 0,
      subtotalPaise: 0,
      itemizedSummary: [],
    };
    return {
      totalFabricMeters: 0,
      materialCostPaise: 0,
      laborCostPaise: 0,
      foamCostPaise: 0,
      subtotalPaise: 0,
      subtotalRupees: 0,
      breakdown: emptyBreakdown,
    };
  }

  const seatCount = Math.max(1, config.seatCount || 1);
  const baseMeters = rateCard.upholstery.fabricMeters[config.furnitureType] ?? 4.5;
  const baseLabor = rateCard.upholstery.baseLaborCharge[config.furnitureType] ?? 1500;

  // For individual seating items like dining chairs, scale by seatCount
  const isIndividualUnit =
    config.furnitureType === 'dining_chair_seat_only' ||
    config.furnitureType === 'dining_chair_full' ||
    config.furnitureType === 'ottoman_footstool';

  let totalFabricMeters: number;
  let laborCostPaise: number;

  if (config.customFabricMeters !== undefined && config.customFabricMeters > 0) {
    totalFabricMeters = config.customFabricMeters;
    laborCostPaise = Math.round((isIndividualUnit ? baseLabor * seatCount : baseLabor) * 100);
  } else if (isIndividualUnit) {
    totalFabricMeters = Math.round(baseMeters * seatCount * 10) / 10;
    laborCostPaise = Math.round(baseLabor * seatCount * 100);
  } else {
    totalFabricMeters = baseMeters;
    laborCostPaise = Math.round(baseLabor * 100);
  }

  const materialCostPaise = Math.round(totalFabricMeters * fabricPricePerMeter * 100);

  let foamCostPaise = 0;
  if (config.includeFoamReplacement && config.foamGrade && config.foamGrade !== 'none') {
    const foamRate = rateCard.upholstery.foamRatesPerSeat[config.foamGrade] ?? 0;
    foamCostPaise = Math.round(seatCount * foamRate * 100);
  }

  const subtotalPaise = materialCostPaise + laborCostPaise + foamCostPaise;

  const itemizedSummary: ItemizedCost[] = [
    {
      label: `Upholstery Fabric (${totalFabricMeters}m @ ₹${fabricPricePerMeter}/m)`,
      amountPaise: materialCostPaise,
    },
    {
      label: `Craftsman Upholstery Labor (${config.furnitureType.replace(/_/g, ' ')}, ${seatCount} seat${seatCount === 1 ? '' : 's'})`,
      amountPaise: laborCostPaise,
    },
  ];

  if (foamCostPaise > 0 && config.foamGrade) {
    itemizedSummary.push({
      label: `High-Density Foam Replacement (${config.foamGrade.replace(/_/g, ' ')}, ${seatCount} seats)`,
      amountPaise: foamCostPaise,
    });
  }

  const breakdown: MeasurementBreakdown = {
    fabricRequiredMeters: totalFabricMeters,
    materialCostPaise,
    laborCostPaise,
    foamCostPaise,
    subtotalPaise,
    itemizedSummary,
  };

  return {
    totalFabricMeters,
    materialCostPaise,
    laborCostPaise,
    foamCostPaise,
    subtotalPaise,
    subtotalRupees: subtotalPaise / 100,
    breakdown,
  };
}

/**
 * Computes GST tax splits in integer paise.
 * For Intra-state Maharashtra (isInterState: false), CGST (50%) + SGST (50%).
 * Uses integer floor on CGST and allocates remainder to SGST, guaranteeing zero loss.
 * For Inter-state (isInterState: true), IGST (100%).
 */
export function calculateGST(
  subtotalPaise: number,
  isInterState: boolean,
  ratePercent = 18
): GSTBreakdown {
  if (
    !Number.isFinite(subtotalPaise) ||
    subtotalPaise <= 0 ||
    !Number.isFinite(ratePercent) ||
    ratePercent <= 0
  ) {
    return {
      ratePercent: Number.isFinite(ratePercent) ? ratePercent : 0,
      isInterState,
      taxableAmountPaise: Number.isFinite(subtotalPaise) ? Math.max(0, subtotalPaise) : 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalTaxPaise: 0,
    };
  }

  const totalTaxPaise = Math.round((subtotalPaise * ratePercent) / 100);

  if (isInterState) {
    return {
      ratePercent,
      isInterState: true,
      taxableAmountPaise: subtotalPaise,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalTaxPaise,
      totalTaxPaise,
    };
  }

  // Intra-State (e.g. Maharashtra code 27)
  const cgstPaise = Math.floor(totalTaxPaise / 2);
  const sgstPaise = totalTaxPaise - cgstPaise;

  return {
    ratePercent,
    isInterState: false,
    taxableAmountPaise: subtotalPaise,
    cgstPaise,
    sgstPaise,
    igstPaise: 0,
    totalTaxPaise,
  };
}

/**
 * Generates the next sequential invoice number in the format EF-{YEAR}-{5-digit-sequence}.
 */
export function generateNextInvoiceNumber(
  lastInvoiceNumber: string | null,
  currentYear = new Date().getFullYear()
): string {
  const prefix = `EF-${currentYear}-`;
  if (!lastInvoiceNumber || !lastInvoiceNumber.startsWith(prefix)) {
    return `${prefix}00001`;
  }
  const currentSeqStr = lastInvoiceNumber.replace(prefix, '');
  const currentSeq = parseInt(currentSeqStr, 10);
  const nextSeq = isNaN(currentSeq) ? 1 : currentSeq + 1;
  return `${prefix}${nextSeq.toString().padStart(5, '0')}`;
}
