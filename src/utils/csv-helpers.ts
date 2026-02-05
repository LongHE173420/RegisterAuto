import fs from "fs";
import { parse } from "csv-parse/sync";
import { type ApiRes, type RegisterPayload } from "../api/auth.api";

export type CsvRow = {
    phone: string;
    password: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
};

export function loadCsvRecords(filePath: string): CsvRow[] {
    if (!fs.existsSync(filePath)) {
        throw new Error("CSV_NOT_FOUND");
    }
    let contentBuf: Buffer;
    try {
        contentBuf = fs.readFileSync(filePath);
    } catch {
        throw new Error("CSV_READ_FAIL");
    }
    let records: CsvRow[] = [];
    try {
        records = parse(contentBuf, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        }) as CsvRow[];
    } catch {
        throw new Error("CSV_PARSE_FAIL");
    }
    if (!Array.isArray(records) || records.length === 0) {
        throw new Error("CSV_EMPTY");
    }
    return records;
}

export function parseApiRes(body: any): ApiRes | null {
    if (!body || typeof body !== "object") return null;
    if (typeof (body as any).isSucceed === "boolean") return body as ApiRes;
    return null;
}

export function pickGender(g?: string): RegisterPayload["gender"] {
    const x = String(g || "").trim().toUpperCase();
    if (x === "MALE" || x === "FEMALE" || x === "OTHER") return x;
    return "MALE";
}

type PhoneNorm = { ok: boolean; local?: string; e164?: string; reason?: string };

export function normalizeVietnamPhone(input: string): PhoneNorm {
    const raw = String(input || "").trim();
    if (!raw) return { ok: false, reason: "empty" };

    let d = raw.replace(/\D/g, "");
    if (d.startsWith("0084")) d = d.slice(2);

    let local = "";
    if (d.startsWith("84")) {
        const rest = d.slice(2);
        local = "0" + rest;
    } else if (d.startsWith("0")) {
        local = d;
    } else {
        return { ok: false, reason: "must_start_with_0_or_84" };
    }

    if (local.length !== 10) return { ok: false, reason: "invalid_length" };
    if (!/^(03|05|07|08|09)\d{8}$/.test(local)) {
        return { ok: false, reason: "invalid_vn_mobile_prefix" };
    }

    const e164 = "+84" + local.slice(1);
    return { ok: true, local, e164 };
}

export function validateRow(row: CsvRow, seenPhones: Set<string>): { valid: boolean; phone?: string; reason?: string } {
    const phoneRaw = String(row.phone || "").trim();
    const password = String(row.password || "").trim();

    const norm = normalizeVietnamPhone(phoneRaw);
    if (!norm.ok) {
        return { valid: false, reason: `invalid_phone_format:${norm.reason}` };
    }

    const phone = norm.local!;
    if (!phone || !password) {
        return { valid: false, reason: "missing_phone_or_password" };
    }
    if (seenPhones.has(phone)) {
        return { valid: false, reason: "duplicate_in_csv" };
    }

    return { valid: true, phone };
}

export function buildPayload(row: CsvRow, phone: string): RegisterPayload {
    return {
        phone,
        password: row.password?.trim(),
        confirmedPassword: row.password?.trim(),
        firstName: row.firstName?.trim() || "Auto",
        lastName: row.lastName?.trim() || "User",
        gender: pickGender(row.gender),
        dateOfBirth: row.dateOfBirth || "2000-01-01",
        location: { lat: 10.7, lon: 106.6, source: "CSV" },
    };
}
