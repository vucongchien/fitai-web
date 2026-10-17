export type AuthTab = "login" | "register";

export type RegisterSubStep = "VERIFY_IDENTIFIER" | "PROFILE_DETAILS";

export type IdentifierType = "phone" | "email" | "invalid";

import { Gender } from "@/shared/api/gen/contracts/generic/auth/v1/message/auth_messages_pb";

export { Gender };

export interface RegisterFormState {
  identifier: string;
  otpCode: string;
  otpToken: string;
  fullName: string;
  password: string;
  gender: Gender;
  dateOfBirth: string;
  avatarUrl: string;
  avatarSeed: string;
  isCustomAvatar: boolean;
}

export type AuthActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
