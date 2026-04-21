import { mockDeep, mockReset } from 'jest-mock-extended';

// Prisma 6+ deep types crash TypeScript's inference in tests.
// Return `any` so tests can chain .mockResolvedValue/.mockRejectedValue freely.
// Runtime behavior is preserved — only type assistance is lost.
export type MockPrisma = any;

export function createPrismaMock(): MockPrisma {
  return mockDeep() as any;
}

export function resetPrismaMock(mock: MockPrisma) {
  mockReset(mock);
}
