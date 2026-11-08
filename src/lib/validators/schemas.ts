import { z } from 'zod';

/**
 * Zod schemas for Client CRM, Room, and Measurement forms.
 * Enforces strict validation according to Indian market and trade requirements.
 */

export const indianPhoneRegex = /^[6-9]\d{9}$/;
export const indianPincodeRegex = /^\d{6}$/;

export const addressSchema = z.object({
  street: z.string().min(3, 'Street address is required (min 3 characters)'),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required').default('Mumbai'),
  state: z.string().min(2, 'State is required').default('Maharashtra'),
  pincode: z.string().regex(indianPincodeRegex, 'Pincode must be exactly 6 digits'),
  country: z.literal('India').default('India'),
});

export const clientFormSchema = z.object({
  name: z.string().min(2, 'Client name must be at least 2 characters'),
  phone: z.string().regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)'),
  alternatePhone: z
    .string()
    .optional()
    .refine((val) => !val || indianPhoneRegex.test(val), {
      message: 'Alternate phone must be a valid 10-digit Indian number',
    }),
  email: z.string().email('Please enter a valid email address'),
  billingAddress: addressSchema,
  siteAddress: addressSchema,
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  architectDesignerName: z.string().optional(),
  gstin: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val), {
      message: 'Invalid Indian GSTIN format (e.g. 27AABCE1234F1Z5)',
    }),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const roomFormSchema = z.object({
  name: z.string().min(2, 'Room name must be at least 2 characters (e.g., Living Room French Window)'),
  type: z.enum([
    'living_room',
    'master_bedroom',
    'guest_bedroom',
    'kids_bedroom',
    'dining_room',
    'home_theatre',
    'balcony',
    'study_office',
    'pooja_room',
    'other',
  ]),
  floor: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).default([]),
});

export type RoomFormData = z.infer<typeof roomFormSchema>;

export const productFormSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  brand: z.string().min(2, 'Brand must be at least 2 characters').default('In-House Excellence'),
  category: z.enum([
    'curtains_window_treatments',
    'sofa_upholstery_fabrics',
    'wallpapers',
    'mattresses_sleep_solutions',
    'bedding_accessories',
    'home_decor',
  ]),
  subcategory: z.string().min(2, 'Subcategory is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional().default(''),
  pricePerUnit: z.coerce.number().positive('Price must be greater than zero'),
  unit: z.enum(['meter', 'roll', 'piece', 'sq.ft']).default('meter'),
  mrp: z.coerce.number().optional(),
  stockQuantity: z.coerce.number().int().nonnegative('Stock cannot be negative').default(100),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  hsnCode: z.string().min(4, 'HSN code must be at least 4 digits').default('5407'),
  gstRatePercent: z.coerce.number().refine((val) => [5, 12, 18, 28].includes(val), {
    message: 'GST rate must be 5%, 12%, 18%, or 28%',
  }).default(18),
  swatchImage: z.string().url('Swatch image must be a valid URL'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least 1 product image is required'),
  colors: z.array(z.string()).default([]),
  colorHexes: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  materials: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  fabricWidthCm: z.coerce.number().optional(),
  weightGsm: z.coerce.number().optional(),
  composition: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

export const paymentLogSchema = z.object({
  amount: z.coerce.number().positive('Payment amount must be greater than zero'),
  method: z.enum(['upi', 'credit_debit_card', 'net_banking', 'cheque', 'cash', 'bank_neft_rtgs']),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.string().min(2, 'Staff name is required').default('Mr. Altaf Chauhan'),
});

export type PaymentLogFormData = z.infer<typeof paymentLogSchema>;

export const orderItemFormSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(2, 'Item name is required'),
  category: z.string().default('curtains_window_treatments'),
  quantity: z.coerce.number().positive('Quantity must be greater than zero'),
  unit: z.string().default('meter'),
  unitPrice: z.coerce.number().positive('Unit price must be positive'),
  swatchImageUrl: z.string().optional(),
});

export const manualOrderFormSchema = z.object({
  clientId: z.string().min(1, 'Please select or specify a client'),
  clientName: z.string().min(2, 'Client name is required'),
  clientPhone: z.string().regex(indianPhoneRegex, 'Valid 10-digit phone number is required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  deliveryAddress: addressSchema,
  items: z.array(orderItemFormSchema).min(1, 'At least one order item is required'),
  discountPaise: z.coerce.number().nonnegative().default(0),
  internalNotes: z.string().optional(),
  initialPaymentAmount: z.coerce.number().nonnegative().default(0),
  initialPaymentMethod: z.enum(['upi', 'credit_debit_card', 'net_banking', 'cheque', 'cash', 'bank_neft_rtgs']).default('upi'),
  initialPaymentRef: z.string().optional(),
});

export type ManualOrderFormData = z.infer<typeof manualOrderFormSchema>;

