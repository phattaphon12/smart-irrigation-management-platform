/**
 * การรวมค่ารังสีดวงอาทิตย์ (Rs) และรังสีนอกบรรยากาศ (Ra) — §4.3, §4.4
 *
 * สำคัญที่สุด: Rs ต้องรวมด้วย trapezoidal integration ไม่ใช่ sum อย่างง่าย
 * เพราะข้อมูลมีช่วงขาดหายเป็นประจำ (~07:00-10:00) การ sum จะนับชั่วโมงที่ขาดหายเป็นพลังงานศูนย์
 * ทำให้ Rs ต่ำกว่าจริงและ ETo ต่ำตาม (ตัวอย่างจริง: ได้ 2.79 แทนที่จะเป็น 3.62 มม./วัน)
 */
import { FIELD_CONSTANTS } from '../../constants/fieldConstants';
import { FAO_CONSTANTS } from '../../constants/faoConstants';

/**
 * รวมค่า solarradiation (W/m²) แบบ trapezoidal ตลอดทั้งวัน แล้วแปลงเป็น MJ/m²/วัน
 * @param {Array<[number, number]>} solarPoints - [(seconds_since_midnight, W/m²), ...]
 * @returns {number} Rs [MJ/m²/วัน]
 */
export function rsTrapezoidal(solarPoints) {
  if (!solarPoints || solarPoints.length === 0) return 0;
  const pts = [...solarPoints].sort((p1, p2) => p1[0] - p2[0]);
  const xs = [0, ...pts.map((p) => p[0]), 86400]; // ครอบทั้งวัน 0-86400 วินาที
  const ys = [pts[0][1], ...pts.map((p) => p[1]), pts[pts.length - 1][1]];

  let integralJ = 0; // J/m^2
  for (let i = 0; i < xs.length - 1; i += 1) {
    integralJ += ((ys[i] + ys[i + 1]) / 2) * (xs[i + 1] - xs[i]);
  }
  return integralJ / 1e6; // J/m² -> MJ/m²/วัน
}

/** day-of-year (1-366) จาก Date object */
export function dayOfYear(date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date - start;
  return Math.floor(diffMs / 86400000) + 1;
}

/**
 * รังสีนอกบรรยากาศ Ra และ clear-sky radiation Rso (§4.4)
 * @param {number} doy - day of year
 * @returns {{ra: number, rso: number}} [MJ/m²/วัน]
 */
export function extraterrestrialRadiation(doy) {
  const { latitude, elevation } = FIELD_CONSTANTS;
  const { solarConstant } = FAO_CONSTANTS;
  const phi = (latitude * Math.PI) / 180;

  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * doy) / 365 - 1.39);
  const omegaS = Math.acos(-Math.tan(phi) * Math.tan(delta));

  const ra =
    ((24 * 60) / Math.PI) *
    solarConstant *
    dr *
    (omegaS * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(omegaS));

  const rso = (0.75 + 2e-5 * elevation) * ra;

  return { ra, rso };
}

/** ความดันไอน้ำอิ่มตัว e°(T) [kPa] */
export function saturationVaporPressure(tempC) {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/** สมดุลรังสีสุทธิ Rn = Rns - Rnl (§4.4) */
export function netRadiation({ tmax, tmin, rs, rso, ea }) {
  const { referenceAlbedo, stefanBoltzmann } = FAO_CONSTANTS;
  const rns = (1 - referenceAlbedo) * rs; // = 0.77 * Rs เมื่อ albedo=0.23

  const tmaxK4 = (tmax + 273.16) ** 4;
  const tminK4 = (tmin + 273.16) ** 4;
  const rsRatio = Math.min(rs / rso, 1);

  const rnl = stefanBoltzmann * ((tmaxK4 + tminK4) / 2) * (0.34 - 0.14 * Math.sqrt(ea)) * (1.35 * rsRatio - 0.35);

  return { rns, rnl, rn: rns - rnl };
}
