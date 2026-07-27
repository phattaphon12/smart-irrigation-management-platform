/**
 * Watermark 200SS soil moisture sensor — ADC -> resistance -> kPa -> VWC -> %AWC.
 * Mirrors sugarcane-dashboard/src/lib/calculations/soilMoisture.js exactly (same
 * constants/checkpoints, per dev_reference_sensor_et_v1.md §3) so backend-processed
 * readings (from POST /api/ingest/log) land on the same scale as the historical
 * data already in node_log. Duplicated rather than imported because the frontend
 * and backend are separate npm packages, not a shared workspace.
 *
 * Most common implementation mistake (§3.2): computing kPa from only the numerator
 * (-3.213*R - 4.093) and forgetting to divide by the full denominator — this makes
 * readings look "less dry than they really are." Verify against the checkpoint
 * table in verifyCheckpoints() below if this ever needs to change.
 */

const R_DIVIDER_KOHM = 10; // 10kΩ voltage divider (VCC 3.3V -> R_div -> ADC pin -> Watermark -> GND)
const ADC_MAX = 4095; // 12-bit ADC
const ADC_VALID_MIN = 10; // ADC at/below this reads as an open circuit -> invalid

const SHOCK_SEDDIGH = { a: -3.213, b: -4.093, c: 0.009733, d: 0.01205 }; // Shock & Seddigh (1998)
const ASSUMED_SOIL_TEMP_C = 24; // no on-node temperature sensor; denominator = 1 - 0.01205*24 = 0.7108
const KPA_CLIP_MIN = -200;

const VAN_GENUCHTEN = { thetaR: 0.04, thetaS: 0.42, alpha: 0.118, n: 1.64 }; // Van Genuchten (1980), treatment-calibrated
const VG_M = 1 - 1 / VAN_GENUCHTEN.n;

const WILTING_POINT_VWC = 0.0538; // theta_wp
const AVAILABLE_WATER_CAPACITY = 0.1391; // Field Capacity (0.193) - Wilting Point (0.0538)

function adcToResistanceKohm(adc) {
  return R_DIVIDER_KOHM * (ADC_MAX / adc - 1);
}

function resistanceToKpa(rKohm) {
  const { a, b, c, d } = SHOCK_SEDDIGH;
  const denominator = 1 - d * ASSUMED_SOIL_TEMP_C - c * rKohm;
  const rawKpa = (a * rKohm + b) / denominator;
  return Math.max(rawKpa, KPA_CLIP_MIN);
}

function kpaToVwc(kpa) {
  const { thetaR, thetaS, alpha, n } = VAN_GENUCHTEN;
  return thetaR + (thetaS - thetaR) / (1 + (alpha * Math.abs(kpa)) ** n) ** VG_M;
}

function vwcToPercentAwc(vwc) {
  return ((vwc - WILTING_POINT_VWC) / AVAILABLE_WATER_CAPACITY) * 100;
}

/** raw ADC (0-4095) -> { kpa, vwc, awc }; all null if the ADC reading is an open circuit */
export function adcToAll(adc) {
  if (adc == null || adc <= ADC_VALID_MIN) {
    return { kpa: null, vwc: null, awc: null };
  }
  const rKohm = adcToResistanceKohm(adc);
  const kpa = resistanceToKpa(rKohm);
  const vwc = kpaToVwc(kpa);
  const awc = vwcToPercentAwc(vwc);
  return { kpa, vwc, awc };
}
