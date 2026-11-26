import { describe, it, expect, jest, beforeEach } from '@jest/globals';

jest.mock('@/lib/supabase', () => {
  const select = jest.fn().mockReturnThis();
  const insert = jest.fn().mockReturnThis();
  const update = jest.fn().mockReturnThis();
  const del = jest.fn().mockReturnThis();
  const eq = jest.fn().mockReturnThis();
  const order = jest.fn().mockReturnThis();
  const limit = jest.fn().mockReturnThis();
  const range = jest.fn().mockReturnThis();
  const single = jest.fn().mockResolvedValue({ data: null, error: null } as never);
  const invoke = jest.fn().mockResolvedValue({ data: {}, error: null } as never);

  const queryBuilder = {
    select,
    insert,
    update,
    delete: del,
    eq,
    order,
    limit,
    range,
    single,
  };

  return {
    __esModule: true,
    supabase: {
      from: jest.fn(() => queryBuilder),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        } as never),
      },
      functions: {
        invoke,
      },
    },
  };
});

import * as api from '@/lib/api';
import { supabase } from '@/lib/supabase';

describe('govpass API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exports all expected API functions', () => {
    expect(typeof api.analyzeDocument).toBe('function');
    expect(typeof api.getEligiblePrograms).toBe('function');
    expect(typeof api.getUserApplications).toBe('function');
    expect(typeof api.getNotifications).toBe('function');
  });

  it('getEligiblePrograms queries programs table with is_active filter', async () => {
    await api.getEligiblePrograms();

    expect(supabase.from).toHaveBeenCalledWith('programs');
    const qb = (supabase.from as any)();
    expect(qb.select).toHaveBeenCalledWith('*');
    expect(qb.eq).toHaveBeenCalledWith('is_active', true);
    expect(qb.order).toHaveBeenCalledWith('name');
  });

  it('getUserApplications calls supabase with correct table and user_id', async () => {
    await api.getUserApplications('user-123');

    expect(supabase.from).toHaveBeenCalledWith('applications');
    const qb = (supabase.from as any)();
    expect(qb.select).toHaveBeenCalledWith('*');
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('getNotifications calls supabase with correct table, user_id, and limit', async () => {
    await api.getNotifications('user-456');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    const qb = (supabase.from as any)();
    expect(qb.eq).toHaveBeenCalledWith('user_id', 'user-456');
    expect(qb.limit).toHaveBeenCalledWith(20);
  });

  it('analyzeDocument invokes analyze-image edge function', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: {
        documentType: 'tax_return',
        extractedData: { fullName: 'John Doe', income: 45000 },
        confidence: 'high',
        eligibilityHints: ['SNAP', 'Medicaid'],
        summary: 'Tax return analyzed successfully.',
      },
      error: null,
    });

    const result = await api.analyzeDocument('user-123', 'base64data', 'tax_return');

    expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-image', {
      body: expect.objectContaining({
        imageBase64: 'base64data',
        userId: 'user-123',
        context: 'govpass-tax_return',
      }),
    });
    expect(result.documentType).toBe('tax_return');
  });

  it('analyzeDocument throws when edge function returns error', async () => {
    (supabase.functions.invoke as any).mockResolvedValueOnce({
      data: null,
      error: new Error('Analysis failed'),
    });

    await expect(api.analyzeDocument('user-123', 'base64', 'id')).rejects.toThrow();
  });
});
