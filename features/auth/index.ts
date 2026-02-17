export { EmailChangeNotificationEmail } from "@/features/auth/emails/email-change-notification-email";
export { EmailVerificationEmail } from "@/features/auth/emails/email-verification-email";
export { PasswordChangedEmail } from "@/features/auth/emails/password-changed-email";
export { ResetPasswordEmail } from "@/features/auth/emails/reset-password-email";
export { WelcomeEmail } from "@/features/auth/emails/welcome-email";

export { ForgotPasswordLink } from "@/features/auth/components/forgot-password-link";
export { ForgotPasswordForm } from "@/features/auth/components/forms/forgot-password-form";
export { ResetPasswordForm } from "@/features/auth/components/forms/reset-password-form";
export { SignInForm } from "@/features/auth/components/forms/sign-in-form";
export { SignUpForm } from "@/features/auth/components/forms/sign-up-form";
export { SignOutButton } from "@/features/auth/components/sign-out-button";

export {
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
} from "@/features/auth/schemas/auth.schema";

export type {
  ForgotPasswordSchemaType,
  ResetPasswordSchemaType,
  SignInSchemaType,
  SignUpSchemaType,
} from "@/features/auth/schemas/auth.schema";

export {
  passwordSchema,
  UpdatePasswordSchema,
} from "@/features/auth/schemas/password.schema";

export type { UpdatePasswordSchemaType } from "@/features/auth/schemas/password.schema";

export { verifyEmail } from "@/features/auth/services/verify-email.service";
export type {
  VerifyEmailInput,
  VerifyEmailResult,
} from "@/features/auth/services/verify-email.service";
