'use server';

import prisma from './prisma'; // Adjust path if necessary

export async function getTokenDisplayData(counterId: string) {
  try {
    await prisma.$connect();
    // Fetch the counter to ensure it exists and get its name
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      select: { name: true }, // Only fetch the name
    });

    if (!counter) {
      return { error: 'Counter not found', data: null };
    }

    // Fetch the token queue for the given counter
    const tokenQueue = await prisma.tokenQueue.findMany({
      where: { counterId: counterId },
      orderBy: { createdAt: 'asc' }, // Order by creation time to get the correct sequence
    });

    // Determine current and next tokens
    const currentToken = tokenQueue.find(token => token.status === 'CALLED'); // Assuming 'CALLED' is the current token
    const nextToken = tokenQueue.find(token => token.status === 'WAITING'); // Assuming 'WAITING' is the next token

    const queue = tokenQueue
      .filter(token => token.status === 'WAITING' && token.id !== nextToken?.id) // Exclude the next token from the general queue list
      .map(token => token.tokenNumber.toString()); // Convert to string for display

    const data = {
      counterName: counter.name,
      current: currentToken?.tokenNumber.toString() || null,
      next: nextToken?.tokenNumber.toString() || null,
      queue: queue,
    };

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching token display data:', error);
    return { data: null, error: 'Failed to fetch token data.' };
  }
}
