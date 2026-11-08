import { describe, it, expect, beforeEach } from 'vitest';
import {
  clientFormSchema,
  roomFormSchema,
  indianPhoneRegex,
  indianPincodeRegex,
} from '@/lib/validators/schemas';
import {
  fetchClients,
  fetchClientById,
  saveClient,
  modifyClient,
  removeClient,
  fetchRooms,
  fetchRoomById,
  saveRoom,
  fetchMeasurementsByClient,
  saveMeasurement,
} from '@/lib/firebase/firestore';
import { mockDb } from '@/lib/firebase/mock-db';
import { Client } from '@/types/client';
import { Room } from '@/types/room';
import { RoomMeasurement } from '@/types/measurement';

describe('Admin CRM Module (tests/unit/crm.test.ts)', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('Client Form Validation (Zod Schema)', () => {
    it('validates a complete, authentic Mumbai client record successfully', () => {
      const validClient = {
        name: 'Mr. Cyrus Poonawalla',
        phone: '9820011223',
        alternatePhone: '9820044556',
        email: 'cyrus.p@example.com',
        billingAddress: {
          street: 'Sea Face Towers, Worli Sea Face',
          landmark: 'Opposite Coast Guard HQ',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400030',
          country: 'India' as const,
        },
        siteAddress: {
          street: 'Penthouse 24, Oberoi Sky Heights, Lokhandwala',
          landmark: 'Near Cafe Arfa, S.V. Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India' as const,
        },
        tags: ['VIP', 'Residential', 'Architect'],
        architectDesignerName: 'Studio Archline Mumbai',
        gstin: '27AABCE1234F1Z5',
        notes: 'Prefers heavy velvet curtains with 2.5x fullness and Somfy automation.',
      };

      const result = clientFormSchema.safeParse(validClient);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Mr. Cyrus Poonawalla');
        expect(result.data.phone).toBe('9820011223');
        expect(result.data.billingAddress.pincode).toBe('400030');
      }
    });

    it('rejects invalid Indian mobile numbers that do not match 10-digit [6-9] standards', () => {
      const invalidPhones = [
        '1234567890', // starts with 1
        '5555555555', // starts with 5
        '982001122', // only 9 digits
        '98200112234', // 11 digits
        'abcd982001', // alphabetic
        '+919820011223', // contains +91 in raw 10-digit field
      ];

      for (const phone of invalidPhones) {
        expect(indianPhoneRegex.test(phone)).toBe(false);

        const testData = {
          name: 'Test Client',
          phone,
          email: 'test@example.com',
          billingAddress: {
            street: '123 Link Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400053',
            country: 'India',
          },
          siteAddress: {
            street: '123 Link Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400053',
            country: 'India',
          },
          tags: [],
        };

        const result = clientFormSchema.safeParse(testData);
        expect(result.success).toBe(false);
      }
    });

    it('validates 6-digit Indian Postal Codes (Pincode)', () => {
      expect(indianPincodeRegex.test('400058')).toBe(true); // Andheri West
      expect(indianPincodeRegex.test('400053')).toBe(true); // Andheri Lokhandwala
      expect(indianPincodeRegex.test('400049')).toBe(true); // Juhu
      expect(indianPincodeRegex.test('400050')).toBe(true); // Bandra West

      expect(indianPincodeRegex.test('40058')).toBe(false); // 5 digits
      expect(indianPincodeRegex.test('4000058')).toBe(false); // 7 digits
      expect(indianPincodeRegex.test('40005A')).toBe(false); // alphanumeric
    });

    it('rejects client when required address fields are missing', () => {
      const incomplete = {
        name: 'Anita Desai',
        phone: '9820199887',
        email: 'anita@example.com',
        billingAddress: {
          street: '', // invalid: empty
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India',
        },
        siteAddress: {
          street: 'Valid Street 45',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '999', // invalid: only 3 digits
          country: 'India',
        },
        tags: [],
      };

      const result = clientFormSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasStreetError = result.error.issues.some(
          (i) => i.path.join('.') === 'billingAddress.street'
        );
        const hasPincodeError = result.error.issues.some(
          (i) => i.path.join('.') === 'siteAddress.pincode'
        );
        expect(hasStreetError).toBe(true);
        expect(hasPincodeError).toBe(true);
      }
    });

    it('validates correct Indian GSTIN format and rejects malformed GSTINs', () => {
      const validGstinData = {
        name: 'Design Studio LLP',
        phone: '9820112233',
        email: 'accounts@designstudio.in',
        billingAddress: {
          street: 'Sajid Tower, S.V. Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India',
        },
        siteAddress: {
          street: 'Sajid Tower, S.V. Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400058',
          country: 'India',
        },
        gstin: '27AABCE1234F1Z5', // Maharashtra code 27 + 10-char PAN + 1 + Z + check digit
        tags: ['Commercial'],
      };

      expect(clientFormSchema.safeParse(validGstinData).success).toBe(true);

      const invalidGstinData = {
        ...validGstinData,
        gstin: 'INVALID_GSTIN_123',
      };
      expect(clientFormSchema.safeParse(invalidGstinData).success).toBe(false);
    });
  });

  describe('Client Data Layer & Search Operations', () => {
    it('creates, retrieves, and persists clients in mock repository', async () => {
      const newClient: Client = {
        id: 'client-test-tarun',
        name: 'Mr. Tarun Tahiliani',
        phone: '9820055443',
        email: 'tarun@tahiliani.com',
        billingAddress: {
          street: 'Villa 12, Carter Road',
          landmark: 'Sea View',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
        },
        siteAddress: {
          street: 'Villa 12, Carter Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          country: 'India',
        },
        tags: ['VIP', 'Architect'],
        totalOrdersCount: 0,
        totalSpentPaise: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saved = await saveClient(newClient);
      expect(saved.id).toBe('client-test-tarun');

      const fetched = await fetchClientById('client-test-tarun');
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe('Mr. Tarun Tahiliani');
      expect(fetched?.billingAddress.city).toBe('Mumbai');
    });

    it('filters clients by search query matching name, phone, email, or site address', async () => {
      const allClients = await fetchClients();
      expect(allClients.length).toBeGreaterThanOrEqual(2);

      // Search by partial name
      const byName = await fetchClients('Rajesh');
      expect(byName.length).toBe(1);
      expect(byName[0].name).toContain('Rajesh');

      // Search by phone
      const byPhone = await fetchClients('9820112345');
      expect(byPhone.length).toBe(1);
      expect(byPhone[0].id).toBe('client-rajesh-sharma');

      // Search by site address keyword
      const byAddress = await fetchClients('Juhu');
      expect(byAddress.length).toBe(1);
      expect(byAddress[0].name).toContain('Priya Kapoor');
    });

    it('updates client tags, notes, and contact info accurately', async () => {
      const updated = await modifyClient('client-rajesh-sharma', {
        notes: 'Updated client requirement: Added Roman blinds for study room.',
        tags: ['VIP', 'Residential', 'Bulk'],
      });

      expect(updated).not.toBeNull();
      expect(updated?.notes).toContain('Added Roman blinds');
      expect(updated?.tags).toContain('Bulk');

      const refetched = await fetchClientById('client-rajesh-sharma');
      expect(refetched?.tags).toContain('Bulk');
    });

    it('soft deletes / removes clients cleanly', async () => {
      const deleted = await removeClient('client-rajesh-sharma');
      expect(deleted).toBe(true);

      const check = await fetchClientById('client-rajesh-sharma');
      expect(check).toBeNull();
    });
  });

  describe('Room Management & Visual Grid Taxonomy', () => {
    it('validates Room schema across all 8 standard room taxonomy presets', () => {
      const roomTypes = [
        'living_room',
        'master_bedroom',
        'kids_bedroom',
        'guest_bedroom',
        'dining_room',
        'study_office',
        'balcony',
        'other',
      ] as const;

      for (const type of roomTypes) {
        const roomData = {
          name: `${type.replace(/_/g, ' ')} Window 1`,
          type,
          floor: '12th Floor',
          notes: 'High ceiling 320cm',
          photos: ['https://example.com/room.jpg'],
        };
        const validation = roomFormSchema.safeParse(roomData);
        expect(validation.success).toBe(true);
      }
    });

    it('creates and associates rooms with a client profile', async () => {
      const clientId = 'client-priya-kapoor';
      const existingRooms = await fetchRooms(clientId);
      const initialCount = existingRooms.length;

      const newRoom: Room = {
        id: 'room-priya-guest-suite',
        clientId,
        name: 'Guest Bedroom Balcony',
        type: 'guest_bedroom',
        floor: '1st Floor',
        notes: 'Requires sheer voiles and acoustic backing',
        photos: [],
        measurementsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveRoom(newRoom);

      const updatedRooms = await fetchRooms(clientId);
      expect(updatedRooms.length).toBe(initialCount + 1);

      const foundRoom = await fetchRoomById(clientId, 'room-priya-guest-suite');
      expect(foundRoom).not.toBeNull();
      expect(foundRoom?.name).toBe('Guest Bedroom Balcony');
      expect(foundRoom?.type).toBe('guest_bedroom');
    });

    it('retrieves measurements associated with client rooms via fetchMeasurementsByClient', async () => {
      const clientId = 'client-rajesh-sharma';
      const measurements = await fetchMeasurementsByClient(clientId);
      expect(measurements.length).toBeGreaterThanOrEqual(1);

      const firstMeas = measurements[0];
      expect(firstMeas.clientId).toBe(clientId);
      expect(firstMeas.productType).toBe('curtain');
      expect(firstMeas.totalEstimatePaise).toBeGreaterThan(0);
    });
  });
});
