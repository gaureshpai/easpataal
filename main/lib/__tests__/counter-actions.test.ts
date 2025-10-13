import { getAllCountersAction } from '../counter-actions';
import prisma from '@/lib/prisma'; // Assuming prisma is correctly mocked or configured

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  $connect: jest.fn(),
  counter: {
    findMany: jest.fn(),
  },
}));

describe('counter-actions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return all counters successfully', async () => {
    const mockCounters = [
      { id: '1', name: 'Counter 1', location: 'Loc A', status: 'ACTIVE', assignedUserId: null, categoryId: null, assignedUser: null, category: null },
      { id: '2', name: 'Counter 2', location: 'Loc B', status: 'INACTIVE', assignedUserId: 'user1', categoryId: 'cat1', assignedUser: null, category: null },
    ];

    (prisma.counter.findMany as jest.Mock).mockResolvedValue(mockCounters);

    const result = await getAllCountersAction();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCounters);
    expect(prisma.counter.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.counter.findMany).toHaveBeenCalledWith({
      include: {
        assignedUser: true,
        category: true,
      },
    });
  });

  it('should return an error if fetching counters fails', async () => {
    const errorMessage = 'Database error';
    (prisma.counter.findMany as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const result = await getAllCountersAction();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch counters');
    expect(prisma.counter.findMany).toHaveBeenCalledTimes(1);
  });
});
