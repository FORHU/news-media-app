import bcrypt from "bcryptjs";
import { accountsRepository } from "@/repositories/admin/accounts.repository";

export class AccountsServiceError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AccountsServiceError";
  }
}

export const accountsService = {
  getAccounts(tenantId: string) {
    return accountsRepository.findMany(tenantId);
  },

  async createAccount(
    data: { firstName: string; lastName: string; email: string; password: string },
    tenantId: string
  ) {
    const existing = await accountsRepository.findByEmail(data.email, tenantId);
    if (existing) throw new AccountsServiceError("Email already exists", 400);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return accountsRepository.create({ ...data, password: hashedPassword, tenantId });
  },

  async deleteAccount(id: string, tenantId: string) {
    const user = await accountsRepository.findByIdAndTenant(id, tenantId);
    if (!user) throw new AccountsServiceError("User not found", 404);
    return accountsRepository.delete(id);
  },

  async updateAccount(
    id: string,
    data: { firstName?: string; lastName?: string; password?: string },
    tenantId: string
  ) {
    const user = await accountsRepository.findByIdAndTenant(id, tenantId);
    if (!user) throw new AccountsServiceError("User not found", 404);

    const update: Record<string, unknown> = {};
    if (data.firstName) update.firstName = data.firstName;
    if (data.lastName) update.lastName = data.lastName;
    if (data.password) {
      if (data.password.length < 8) {
        throw new AccountsServiceError("Password must be at least 8 characters", 400);
      }
      update.password = await bcrypt.hash(data.password, 10);
    }

    return accountsRepository.update(id, update);
  },
};
