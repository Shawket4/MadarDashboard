/**
 * The two sign-up calls that changed when the server began checking the code at
 * the code step: `POST /public/signup/verify` (phone + code -> a short-lived
 * `signup_token`) and `POST /public/signup` (the token + the shop, no phone or
 * code). Typed by hand until the generated client carries them; the shapes are
 * the backend's (MadarRust `fix/signup-verify-step`).
 */
import { useMutation } from "@tanstack/react-query";

import { customInstance } from "@/data/api/custom-instance";
import type { SignupResponse } from "@/data/api/generated/models";

export interface SignupVerifyRequest {
  phone: string;
  code: string;
}
export interface SignupVerifyResponse {
  signup_token: string;
  expires_in_seconds: number;
}
export interface SignupCreateRequest {
  signup_token: string;
  shop_name: string;
  owner_name: string;
  email: string;
  password: string;
  template: "cafe" | "restaurant";
  terms_version: string;
}

export const verifySignupCode = (data: SignupVerifyRequest, signal?: AbortSignal) =>
  customInstance<SignupVerifyResponse>({
    url: "/public/signup/verify",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data,
    signal,
  });

export const createSignup = (data: SignupCreateRequest, signal?: AbortSignal) =>
  customInstance<SignupResponse>({
    url: "/public/signup",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    data,
    signal,
  });

type Opts<TData, TVars> = Parameters<typeof useMutation<TData, unknown, TVars>>[0];

export const useSignupVerify = (options?: Omit<NonNullable<Opts<SignupVerifyResponse, { data: SignupVerifyRequest }>>, "mutationFn">) =>
  useMutation({ mutationKey: ["signupVerify"], mutationFn: ({ data }: { data: SignupVerifyRequest }) => verifySignupCode(data), ...options });

export const useSignupCreate = (options?: Omit<NonNullable<Opts<SignupResponse, { data: SignupCreateRequest }>>, "mutationFn">) =>
  useMutation({ mutationKey: ["signupCreate"], mutationFn: ({ data }: { data: SignupCreateRequest }) => createSignup(data), ...options });
