/**
 * GET /api/cron/pms-drift-check
 *
 * Nightly canary that validates the Mews Connector API hasn't silently
 * changed any field we depend on.
 *
 * For each active Mews property it:
 *   1. Fetches one recent reservation from the Mews sandbox or live API
 *   2. Validates the response against MEWS_RESERVATION_EXPECTED_FIELDS
 *   3. Writes any drift findings to the pms_alerts table
 *   4. Flips pms_config.health_status to 'degraded' if drift is found
 *   5. Returns a summary so Vercel Cron logs show pass / fail clearly
 *
 * Authentication: CRON_SECRET header (standard Vercel cron pattern).
 *
 * Schedule (vercel.json):
 *   { "path": "/api/cron/pms-drift-check", "schedule": "0 2 * * *" }
 *   — runs at 02:00 UTC every night (10:00 SGT)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import { decryptApiKey } from '@/lib/pms/router';
import {
  MEWS_ENDPOINTS,
  MEWS_RESERVATION_EXPECTED_FIELDS,
  type MewsAuthEnvelope,
  type MewsReservationsGetAllResponse,
  type ExpectedField,
} from '@/lib/pms/adapters/mews-schema';

/* ─────────────────────────────────────────────────────────────────
   TYPES
   ───────────────────────────────────────────────────────────────── */

interface DriftFinding {
  field: string;
  issue: 'missing' | 'wrong_type' | 'required_null';
  expected_type: string;
  actual_type: string;
  purpose: string;
}

interface PropertyCheckResult {
  property_id: string;
  property_name: string;
  status: 'ok' | 'drift_detected' | 'no_reservations' | 'api_error';
  findings: DriftFinding[];
  error?: string;
  sample_reservation_id?: string;
}

/* ─────────────────────────────────────────────────────────────────
   ROUTE HANDLER
   ───────────────────────────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron call (Vercel sends CRON_SECRET)
  const cronSecret = request.headers.get('authorization');
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const runAt = new Date().toISOString();

  // Load all active Mews properties with their pms_config
  const { data: configs, error: configError } = await supabase
    .from('pms_config')
    .select(`
      id,
      property_id,
      provider,
      api_endpoint,
      api_key_encrypted,
      properties ( id, name )
    `)
    .eq('provider', 'mews')
    .eq('is_active', true);

  if (configError) {
    return NextResponse.json(
      { error: `Failed to load pms_config: ${configError.message}` },
      { status: 500 },
    );
  }

  if (!configs || configs.length === 0) {
    return NextResponse.json({
      data: {
        run_at: runAt,
        properties_checked: 0,
        results: [],
        message: 'No active Mews properties found — nothing to check.',
      },
    });
  }

  const results: PropertyCheckResult[] = [];

  for (const config of configs) {
    const propertyName =
      (config.properties as { name?: string } | null)?.name ?? config.property_id;

    const result = await checkPropertyDrift(
      config.property_id,
      propertyName,
      config.api_endpoint,
      config.api_key_encrypted,
    );

    results.push(result);

    // Write findings to pms_alerts and update health_status regardless of outcome
    await persistResult(config.id, config.property_id, result, runAt);
  }

  const driftCount = results.filter((r) => r.status === 'drift_detected').length;
  const errorCount = results.filter((r) => r.status === 'api_error').length;

  return NextResponse.json({
    data: {
      run_at: runAt,
      properties_checked: results.length,
      drift_detected: driftCount,
      api_errors: errorCount,
      results,
    },
  });
}

/* ─────────────────────────────────────────────────────────────────
   CORE DRIFT CHECK — one property
   ───────────────────────────────────────────────────────────────── */

async function checkPropertyDrift(
  propertyId: string,
  propertyName: string,
  apiEndpoint: string,
  apiKeyEncrypted: string,
): Promise<PropertyCheckResult> {
  // Decrypt then parse the api_key blob — routed through decryptApiKey()
  // so Phase 2 encryption is automatically picked up here too.
  let auth: MewsAuthEnvelope;
  try {
    const parsed = JSON.parse(decryptApiKey(apiKeyEncrypted)) as {
      ClientToken?: string;
      AccessToken?: string;
    };
    if (!parsed.ClientToken || !parsed.AccessToken) {
      throw new Error('Missing ClientToken or AccessToken');
    }
    auth = {
      ClientToken: parsed.ClientToken,
      AccessToken: parsed.AccessToken,
      Client: 'Stayscape 1.0.0',
    };
  } catch (err) {
    return {
      property_id: propertyId,
      property_name: propertyName,
      status: 'api_error',
      findings: [],
      error: `Credential parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Fetch the most recent reservation — we only need 1 to validate the schema
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const requestBody = {
    ...auth,
    UpdatedUtc: {
      StartUtc: thirtyDaysAgo.toISOString(),
      EndUtc: now.toISOString(),
    },
    States: ['Confirmed', 'Started', 'Processed', 'Canceled'],
    Limitation: { Count: 1 },
  };

  let sampleReservation: Record<string, unknown>;

  try {
    const platformBase = apiEndpoint.replace(/\/$/, '');
    const url = `${platformBase}${MEWS_ENDPOINTS.reservationsGetAll}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        property_id: propertyId,
        property_name: propertyName,
        status: 'api_error',
        findings: [],
        error: `Mews API ${res.status}: ${errText}`,
      };
    }

    const data = (await res.json()) as MewsReservationsGetAllResponse;

    if (!data.Reservations || data.Reservations.length === 0) {
      return {
        property_id: propertyId,
        property_name: propertyName,
        status: 'no_reservations',
        findings: [],
      };
    }

    sampleReservation = data.Reservations[0] as unknown as Record<string, unknown>;
  } catch (err) {
    return {
      property_id: propertyId,
      property_name: propertyName,
      status: 'api_error',
      findings: [],
      error: `Network error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // Validate the sample against MEWS_RESERVATION_EXPECTED_FIELDS
  const findings = validateFields(sampleReservation, MEWS_RESERVATION_EXPECTED_FIELDS);

  return {
    property_id: propertyId,
    property_name: propertyName,
    status: findings.length > 0 ? 'drift_detected' : 'ok',
    findings,
    sample_reservation_id: typeof sampleReservation['Id'] === 'string'
      ? sampleReservation['Id']
      : undefined,
  };
}

/* ─────────────────────────────────────────────────────────────────
   FIELD VALIDATOR
   Checks every expected field against the live API response.
   ───────────────────────────────────────────────────────────────── */

function validateFields(
  reservation: Record<string, unknown>,
  expectedFields: ExpectedField[],
): DriftFinding[] {
  const findings: DriftFinding[] = [];

  for (const field of expectedFields) {
    const value = reservation[field.name];

    // Required field is completely missing from the response
    if (field.required && !(field.name in reservation)) {
      findings.push({
        field: field.name,
        issue: 'missing',
        expected_type: field.type,
        actual_type: 'undefined',
        purpose: field.purpose,
      });
      continue;
    }

    // Skip if the field is optional and truly absent
    if (!(field.name in reservation)) continue;

    // Required field present but null
    if (field.required && value === null) {
      findings.push({
        field: field.name,
        issue: 'required_null',
        expected_type: field.type,
        actual_type: 'null',
        purpose: field.purpose,
      });
      continue;
    }

    // Type mismatch check
    if (value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const typeMatch = checkType(value, actualType, field.type);

      if (!typeMatch) {
        findings.push({
          field: field.name,
          issue: 'wrong_type',
          expected_type: field.type,
          actual_type: actualType,
          purpose: field.purpose,
        });
      }
    }
  }

  return findings;
}

function checkType(
  value: unknown,
  actualType: string,
  expectedType: string,
): boolean {
  if (expectedType === 'string-or-null') {
    return value === null || typeof value === 'string';
  }
  if (expectedType === 'array') {
    return Array.isArray(value);
  }
  return actualType === expectedType;
}

/* ─────────────────────────────────────────────────────────────────
   PERSIST — write alerts + update health_status
   ───────────────────────────────────────────────────────────────── */

async function persistResult(
  pmsConfigId: string,
  propertyId: string,
  result: PropertyCheckResult,
  runAt: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Determine the new health status
  const healthStatus =
    result.status === 'ok' || result.status === 'no_reservations'
      ? 'healthy'
      : result.status === 'drift_detected'
        ? 'degraded'
        : 'error';

  // Update health_status + last_health_check on pms_config
  await supabase
    .from('pms_config')
    .update({
      health_status: healthStatus,
      last_health_check: runAt,
    })
    .eq('id', pmsConfigId);

  // Write one alert row per drift finding (skip if clean)
  if (result.findings.length === 0 && result.status !== 'api_error') return;

  // For api_error with no findings, write a single alert row
  if (result.status === 'api_error') {
    await supabase.from('pms_alerts').insert({
      property_id: propertyId,
      pms_config_id: pmsConfigId,
      alert_type: 'api_error',
      field_name: null,
      issue: result.error ?? 'Unknown API error',
      expected_type: null,
      actual_type: null,
      field_purpose: null,
      detected_at: runAt,
      resolved: false,
    });
    return;
  }

  // One row per drift finding
  const alertRows = result.findings.map((f) => ({
    property_id: propertyId,
    pms_config_id: pmsConfigId,
    alert_type: 'drift',
    field_name: f.field,
    issue: f.issue,
    expected_type: f.expected_type,
    actual_type: f.actual_type,
    field_purpose: f.purpose,
    detected_at: runAt,
    resolved: false,
  }));

  await supabase.from('pms_alerts').insert(alertRows);
}
