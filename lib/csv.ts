import Papa from "papaparse";
import { normalizePhone } from "./utils";
import { resolveTimezone } from "./timezones";
import type { Lead } from "@/types";

export interface ParsedRow {
  raw: Record<string, string>;
  mapped: Partial<Lead>;
}

const FIELD_MAP: Record<string, keyof Lead> = {
  name: "name", "full name": "name", "contact": "name", "contact name": "name",
  company: "company", organization: "company", business: "company", "company name": "company",
  title: "title", position: "title", role: "title", "job title": "title",
  email: "email", "email address": "email", "e-mail": "email",
  phone: "phone", "phone number": "phone", mobile: "phone", cell: "phone", tel: "phone",
  city: "city", town: "city",
  state: "state", province: "state", region: "state",
  country: "country",
  industry: "industry", sector: "industry", vertical: "industry",
  source: "source", channel: "source",
  notes: "notes", comment: "notes", remarks: "notes",
};

function normalizeHeader(h: string) {
  return h.toLowerCase().trim().replace(/_/g, " ");
}

export function autoMap(headers: string[]): Record<string, keyof Lead | "ignore"> {
  const out: Record<string, keyof Lead | "ignore"> = {};
  for (const h of headers) {
    const norm = normalizeHeader(h);
    out[h] = FIELD_MAP[norm] ?? "ignore";
  }
  return out;
}

export async function parseCsv(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => resolve({ headers: res.meta.fields ?? [], rows: res.data }),
      error: reject,
    });
  });
}

export function applyMapping(
  rows: Record<string, string>[],
  mapping: Record<string, keyof Lead | "ignore">
): Partial<Lead>[] {
  return rows
    .map((row) => {
      const lead: Partial<Lead> = {};
      for (const [csvKey, field] of Object.entries(mapping)) {
        if (field === "ignore") continue;
        const val = (row[csvKey] ?? "").toString().trim();
        if (!val) continue;
        (lead as any)[field] = val;
      }
      // post-process
      if (lead.phone) lead.phone_normalized = normalizePhone(lead.phone);
      lead.timezone = resolveTimezone(lead.city, lead.state, lead.country);
      return lead;
    })
    .filter((l) => l.name && (l.phone || l.email));
}

export interface DedupResult {
  unique: Partial<Lead>[];
  duplicates: Partial<Lead>[];
}

export function dedup(incoming: Partial<Lead>[], existing: Lead[]): DedupResult {
  const phoneSet = new Set(existing.map((l) => l.phone_normalized).filter(Boolean));
  const nameCompanySet = new Set(
    existing.map((l) => `${(l.name || "").toLowerCase()}|${(l.company || "").toLowerCase()}`)
  );

  const unique: Partial<Lead>[] = [];
  const duplicates: Partial<Lead>[] = [];
  const seenInBatch = new Set<string>();

  for (const lead of incoming) {
    const phoneKey = lead.phone_normalized ?? "";
    const ncKey = `${(lead.name || "").toLowerCase()}|${(lead.company || "").toLowerCase()}`;
    const batchKey = phoneKey || ncKey;
    if (
      (phoneKey && phoneSet.has(phoneKey)) ||
      nameCompanySet.has(ncKey) ||
      seenInBatch.has(batchKey)
    ) {
      duplicates.push(lead);
    } else {
      unique.push(lead);
      seenInBatch.add(batchKey);
    }
  }
  return { unique, duplicates };
}
