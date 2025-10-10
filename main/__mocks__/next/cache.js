module.exports = {
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
  // Add other exports from next/cache if needed
};
