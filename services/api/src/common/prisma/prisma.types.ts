// Prisma enum types
// These should match the enums defined in prisma/schema.prisma

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CLOSER = 'CLOSER',
  SETTER = 'SETTER',
}

export enum DealStage {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  SCHEDULED = 'SCHEDULED',
  SHOWED = 'SHOWED',
  CLOSED = 'CLOSED',
  PAID = 'PAID',
  RECYCLE = 'RECYCLE',
}

export enum CallStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}
