import axios from "axios";
import { ENV } from "../config/env";
import { buildHeaders } from "../utils/headers";

export type ApiRes<T = any> = {
  isSucceed: boolean;
  message?: string;
  data?: T;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  password: string;
  confirmedPassword: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  location?: { lat: number; lon: number; source: string };
};

function normalizePhone(raw: string) {
  let p = String(raw || "").trim();
  p = p.replace(/\D/g, "");
  return p;
}


export async function registerUser(payload: RegisterPayload, headers: any) {
  const body: RegisterPayload = {
    ...payload,
    phone: normalizePhone(payload.phone),
  };

  return axios.post(`${ENV.BASE_URL}/auth/register`, body, {
    headers,
    validateStatus: () => true,
    timeout: 60_000,
  });
}

export async function verifyRegisterOtpApi(
  phone: string,
  otp: string,
  headers: any
) {
  return axios.post(
    `${ENV.BASE_URL}/auth/verify-register-otp`,
    { phone: normalizePhone(phone), otp: String(otp || "").trim() },
    {
      headers,
      validateStatus: () => true,
      timeout: 60_000,
    }
  );
}

export async function resendRegisterOtpApi(phone: string, headers: any) {
  return axios.post(
    `${ENV.BASE_URL}/auth/resend-otp-register`,
    { phone: normalizePhone(phone) },
    {
      headers,
      validateStatus: () => true,
      timeout: 60_000,
    }
  );
}

export async function getDebugOtpFromAuthService(phone: string, headers: any) {
  const p = normalizePhone(phone);
  return axios.get(`${ENV.BASE_URL}${ENV.OTP_DEBUG_PATH_PENDING}`, {
    params: { phone: p },
    headers,
    validateStatus: () => true,
  });
}

export async function getDebugRedisOtpFromAuthService(phone: string, headers: any) {
  const p = normalizePhone(phone);
  return axios.get(`${ENV.BASE_URL}${ENV.OTP_DEBUG_PATH_REDIS}`, {
    params: { phone: p },
    headers,
    validateStatus: () => true,
  });
}
