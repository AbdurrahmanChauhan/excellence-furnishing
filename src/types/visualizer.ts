import { TimestampString } from './common';

export type VisualizationStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'demo_completed';

export interface VisualizationRecord {
  readonly id: string;
  readonly userId: string;
  readonly roomImageUrl: string;
  readonly swatchImageUrl: string;
  readonly productType: 'curtain' | 'wallpaper' | 'upholstery';
  readonly productId?: string;
  readonly productName?: string;
  readonly promptUsed?: string;
  readonly resultImageUrl?: string;
  readonly status: VisualizationStatus;
  readonly isDemoFallback: boolean;
  readonly errorMessage?: string;
  readonly createdAt: TimestampString;
  readonly completedAt?: TimestampString;
}

export interface VisualizeResponse {
  readonly success: boolean;
  readonly visualizationId: string;
  readonly originalImageUrl: string;
  readonly swatchImageUrl: string;
  readonly resultImageUrl: string;
  readonly productType: 'curtain' | 'wallpaper' | 'upholstery';
  readonly modelUsed: string;
  readonly isDemoFallback: boolean;
  readonly message?: string;
  readonly createdAt: TimestampString;
}
