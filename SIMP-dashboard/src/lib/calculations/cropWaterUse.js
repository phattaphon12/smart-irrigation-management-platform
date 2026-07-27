/**
 * ETc = ETo × Kc (§4.5) — Kc คำนวณจาก DAP (จำนวนวันหลังปลูก/หลังตัด) ด้วย linear interpolation
 */
import { FIELD_CONSTANTS } from '../../constants/fieldConstants';
import { KC_STAGES } from '../../constants/cropCoefficients';

const MS_PER_DAY = 86400000;

/** จำนวนวันหลังปลูก (plant crop) หรือหลังตัด crop ก่อนหน้า (ratoon) */
export function daysAfterPlanting(date, referenceDate = FIELD_CONSTANTS.plantingDate) {
  const ref = new Date(referenceDate);
  return Math.floor((date - ref) / MS_PER_DAY);
}

/**
 * Kc จาก DAP โดย linear interpolation ในช่วง development/late season
 * @param {number} dap - days after planting/ratooning
 * @param {'plantCrop'|'ratoon'} cropType
 */
export function kcFromDap(dap, cropType = 'plantCrop') {
  const stages = KC_STAGES[cropType];
  if (dap < 0) return stages[0].kcStart;

  let cursor = 0;
  for (const stage of stages) {
    const stageStart = cursor;
    const stageEnd = cursor + stage.days;
    if (dap <= stageEnd) {
      if (stage.kcStart === stage.kcEnd) return stage.kcStart;
      const progress = (dap - stageStart) / stage.days;
      return stage.kcStart + (stage.kcEnd - stage.kcStart) * progress;
    }
    cursor = stageEnd;
  }
  // เลยช่วงที่กำหนด (>360 หรือ >280 วัน) ใช้ Kc ปลายฤดูเป็นค่าคงที่
  const last = stages[stages.length - 1];
  return last.kcEnd;
}

/** ETc = ETo × Kc */
export function calculateEtc(eto, dap, cropType = 'plantCrop') {
  const kc = kcFromDap(dap, cropType);
  return { kc, etc: eto * kc };
}
