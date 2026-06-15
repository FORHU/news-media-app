import bcrypt from "bcryptjs";
import { signAdminJwt, ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE } from "@/lib/auth";
import { authRepository } from "@/repositories/admin/auth.repository";

const MODERATOR_ALLOWED_DOMAINS = ["voicejeju.com", "jejuqq.com", "jejujapan.com", "jejutime.com"];

export class AuthServiceError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export const authService = {
  async login(email: string, password: string, tenantId: string) {
    const tenant = await authRepository.findTenantById(tenantId);
    const domain = tenant?.domain ?? "";

    let user = await authRepository.findAdminByEmail(email, tenantId);

    if (!user) {
      if (!MODERATOR_ALLOWED_DOMAINS.includes(domain)) {
        throw new AuthServiceError("Invalid login credentials", 401);
      }
      user = await authRepository.findModeratorByEmail(email);
    }

    if (!user) throw new AuthServiceError("Invalid login credentials", 401);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new AuthServiceError("Invalid login credentials", 401);

    const token = await signAdminJwt({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    });

    return { token, role: user.role };
  },

  async getSession(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new AuthServiceError("User not found", 404);
    return {
      email: user.email,
      name: `${user.firstName} ${user.lastName}`.trim(),
      role: user.role,
    };
  },

  async verifyEmail(email: string, tenantId: string) {
    const tenant = await authRepository.findTenantById(tenantId);
    const domain = tenant?.domain ?? "";

    const admin = await authRepository.findAdminByEmail(email, tenantId);
    if (admin) return;

    const moderator = await authRepository.findModeratorByEmail(email);
    if (!moderator) throw new AuthServiceError("Forbidden", 403);

    if (!MODERATOR_ALLOWED_DOMAINS.includes(domain)) {
      throw new AuthServiceError("Forbidden", 403);
    }
  },

  cookieOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
      maxAge: 60 * 60 * 24,
    };
  },
};

export { ADMIN_JWT_COOKIE, ADMIN_ROLE_COOKIE };
