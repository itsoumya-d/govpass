import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockSelect = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockEq = jest.fn().mockReturnThis();
const mockOrder = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null } as never);

const mockFunctionsInvoke = jest.fn().mockResolvedValue({ data: {}, error: null } as never);

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      order: mockOrder,
      limit: mockLimit,
      single: mockSingle,
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      } as never),
    },
    functions: {
      invoke: mockFunctionsInvoke,
    },
  },
}));

describe('govpass API functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelect.mockReturnThis();
    mockInsert.mockReturnThis();
    mockUpdate.mockReturnThis();
    mockDelete.mockReturnThis();
    mockEq.mockReturnThis();
    mockOrder.mockReturnThis();
    mockLimit.mockReturnThis();
    mockSingle.mockResolvedValue({ data: null, error: null } as never);
    mockFunctionsInvoke.mockResolvedValue({ data: {}, error: null } as never);
  });

  it('exports all expected API functions', async () => {
    const api = await import('@/lib/api');
    expect(typeof api.analyzeDocument).toBe('function');
    expect(typeof api.getEligiblePrograms).toBe('function');
    expect(typeof api.getUserApplications).toBe('function');
    expect(typeof api.getNotifications).toBe('function');
  });

  it('getEligiblePrograms queries programs table with is_active filter', async () => {
    const { getEligiblePrograms } = await import('@/lib/api');
    const { supabase } = await import('@/lib/supabase');

    await getEligiblePrograms();

    expect(supabase.from).toHaveBeenCalledWith('programs');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder).toHaveBeenCalledWith('name');
  });

  it('getUserApplications calls supabase with correct table and user_id', async () => {
    const { getUserApplications } = await import('@/lib/api');
    const { supabase } = await import('@/lib/supabase');

    await getUserApplications('user-123');

    expect(supabase.from).toHaveBeenCalledWith('applications');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
  });

  it('getNotifications calls supabase with correct table, user_id, and limit', async () => {
    const { getNotifications } = await import('@/lib/api');
    const { supabase } = await import('@/lib/supabase');

    await getNotifications('user-456');

    expect(supabase.from).toHaveBeenCalledWith('notifications');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-456');
    expect(mockLimit).toHaveBeenCalledWith(20);
  });

  it('analyzeDocument invokes analyze-image edge function', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: {
        documentType: 'tax_return',
        extractedData: { fullName: 'John Doe', income: 45000 },
        confidence: 'high',
        eligibilityHints: ['SNAP', 'Medicaid'],
        summary: 'Tax return analyzed successfully.',
      },
      error: null,
    } as never);

    const { analyzeDocument } = await import('@/lib/api');
    const result = await analyzeDocument('user-123', 'base64data', 'tax_return');

    expect(mockFunctionsInvoke).toHaveBeenCalledWith('analyze-image', {
      body: expect.objectContaining({
        imageBase64: 'base64data',
        userId: 'user-123',
        context: 'govpass-tax_return',
      }),
    });
    expect(result.documentType).toBe('tax_return');
  });

  it('analyzeDocument throws when edge function returns error', async () => {
    mockFunctionsInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Analysis failed'),
    } as never);

    const { analyzeDocument } = await import('@/lib/api');
    await expect(analyzeDocument('user-123', 'base64', 'id')).rejects.toThrow();
  });
});
