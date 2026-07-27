import { getCalibrationConfig } from '../config/calibrationConfig.js';

/**
 * Watermark 200SS soil moisture sensor — ADC -> resistance -> kPa -> VWC -> %AWC.
 * Constants now come from calibration_config (editable via the Settings page,
 * see ../config/calibrationConfig.js) instead of being hardcoded here, so a
 * config edit takes effect on the very next call with no restart needed.
 *
 * Most common implementation mistake (§3.2 of dev_reference_sensor_et_v1.md):
 * computing kPa from only the numerator (a*R + b) and forgetting to divide by
 * the full denominator — this makes readings look "less dry than they really
 * are." Verify against the checkpoint table in the spec if this ever needs
 * to change.
 */

function adcToResistanceKohm(adc, cfg) {
  return cfg.r_divider_kohm * (cfg.adc_max / adc - 1);
}

function resistanceToKpa(rKohm, cfg) {
  const denominator = 1 - cfg.ss_d * cfg.assumed_soil_temp_c - cfg.ss_c * rKohm;
  const rawKpa = (cfg.ss_a * rKohm + cfg.ss_b) / denominator;
  return Math.max(rawKpa, cfg.kpa_clip_min);
}

function kpaToVwc(kpa, cfg) {
  const vgM = 1 - 1 / cfg.vg_n;
  return cfg.vg_theta_r + (cfg.vg_theta_s - cfg.vg_theta_r) / (1 + (cfg.vg_alpha * Math.abs(kpa)) ** cfg.vg_n) ** vgM;
}

function vwcToPercentAwc(vwc, cfg) {
  return ((vwc - cfg.wilting_point_vwc) / cfg.available_water_capacity) * 100;
}

/** raw ADC (0-4095) -> { kpa, vwc, awc }; all null if the ADC reading is an open circuit */
export function adcToAll(adc) {
  const cfg = getCalibrationConfig();
  if (adc == null || adc <= cfg.adc_valid_min) {
    return { kpa: null, vwc: null, awc: null };
  }
  const rKohm = adcToResistanceKohm(adc, cfg);
  const kpa = resistanceToKpa(rKohm, cfg);
  const vwc = kpaToVwc(kpa, cfg);
  const awc = vwcToPercentAwc(vwc, cfg);
  return { kpa, vwc, awc };
}
