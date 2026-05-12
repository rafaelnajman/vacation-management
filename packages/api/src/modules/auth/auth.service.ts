import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { Repository } from "typeorm";
import { User } from "../../entities/User.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import type {
  AuthResponse,
  LoginDTO,
  RegisterDTO,
  SafeUser,
} from "@vacation/shared";

export class AuthService {
  constructor(private readonly userRepo: Repository<User>) {}

  async register(dto: RegisterDTO): Promise<AuthResponse> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing)
      throw AppError.conflict("Email already registered", "EMAIL_TAKEN");

    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
    const user = await this.userRepo.save(
      this.userRepo.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
      }),
    );

    return { user: this.toSafe(user), token: this.sign(user) };
  }

  async login(dto: LoginDTO): Promise<AuthResponse> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.email = :email", { email: dto.email })
      .getOne();

    if (!user)
      throw AppError.unauthorized(
        "Invalid email or password",
        "BAD_CREDENTIALS",
      );

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok)
      throw AppError.unauthorized(
        "Invalid email or password",
        "BAD_CREDENTIALS",
      );

    return { user: this.toSafe(user), token: this.sign(user) };
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw AppError.unauthorized();
    return this.toSafe(user);
  }

  private toSafe(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private sign(u: User): string {
    const opts: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign({ sub: u.id, role: u.role }, env.JWT_SECRET, opts);
  }
}
