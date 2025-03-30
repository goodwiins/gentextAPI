import { vi } from 'vitest';

const mockClient = {
  setEndpoint: vi.fn().mockReturnThis(),
  setProject: vi.fn().mockReturnThis(),
};

export class Client {
  constructor() {
    return mockClient;
  }
}

const mockDatabases = {
  listDocuments: vi.fn(),
  deleteDocument: vi.fn(),
};

export class Databases {
  constructor() {
    return mockDatabases;
  }
}

const mockAccount = {
  create: vi.fn(),
  createEmailSession: vi.fn(),
  get: vi.fn(),
  updatePrefs: vi.fn(),
  deleteSession: vi.fn(),
};

export class Account {
  constructor() {
    return mockAccount;
  }
}

export const Query = {
  equal: vi.fn(),
  orderDesc: vi.fn(),
  limit: vi.fn(),
};

export const ID = {
  unique: vi.fn().mockReturnValue('unique-id'),
};

export const Models = {
  Document: {},
}; 