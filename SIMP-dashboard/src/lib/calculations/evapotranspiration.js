/**
 * Pipeline B — ETo ตามสมการ FAO-56 Penman-Monteith (§4.4)
 * ETo = [0.408·Δ·(Rn−G) + γ·(900/(T+273))·u2·(es−ea)] / [Δ + γ·(1+0.34·u2)]
 */
import { FAO_CONSTANTS } from '../../constants/faoConstants';
import { dayOfYear, extraterrestrialRadiation, netRadiation, saturationVaporPressure } from './radiation';

/**
 * คำนวณ ETo รายวันแบบ FAO-56 Penman-Monteith
 * @param {object} daily - ค่ารวมรายวันจาก dailyAggregation.js
 * @param {number} daily.date - JS Date ของวันนั้น
 * @param {number} daily.tmax - °C
 * @param {number} daily.tmin - °C
 * @param {number} daily.tdewMean - °C (แนะนำใช้คำนวณ ea)
 * @param {number} daily.uz - m/s ที่ความสูง anemometer จริง (ก่อนปรับ 2m)
 * @param {number} daily.rs - MJ/m²/วัน (ต้องเป็นค่า trapezoidal แล้ว)
 * @param {number} daily.pAtm - kPa
 * @returns {object} ค่ากลางและผลลัพธ์ ETo ทั้งหมด สำหรับ debug/ตรวจสอบกับ checkpoint §4.6
 */
export function calculateETo(daily) {
  const { date, tmax, tmin, tdewMean, uz, rs, pAtm } = daily;
  const { windFactorAt2_7m } = FAO_CONSTANTS;

  const tmean = (tmax + tmin) / 2;
  const u2 = uz * windFactorAt2_7m;

  const gamma = 0.000665 * pAtm;
  const esTmean = saturationVaporPressure(tmean);
  const delta = (4098 * esTmean) / (tmean + 237.3) ** 2;

  const es = (saturationVaporPressure(tmax) + saturationVaporPressure(tmin)) / 2;
  const ea = saturationVaporPressure(tdewMean); // ใช้ dewPoint ตามคำแนะนำ (§4.4)
  const vpd = es - ea;

  const doy = dayOfYear(date);
  const { ra, rso } = extraterrestrialRadiation(doy);
  const { rns, rnl, rn } = netRadiation({ tmax, tmin, rs, rso, ea });
  const g = 0; // G ≈ 0 สำหรับ timestep รายวัน

  const radiationTerm = (0.408 * delta * (rn - g)) / (delta + gamma * (1 + 0.34 * u2));
  const aerodynamicTerm = (gamma * (900 / (tmean + 273)) * u2 * vpd) / (delta + gamma * (1 + 0.34 * u2));
  const eto = radiationTerm + aerodynamicTerm;

  return {
    tmean,
    u2,
    gamma,
    delta,
    es,
    ea,
    vpd,
    doy,
    ra,
    rso,
    rns,
    rnl,
    rn,
    radiationTerm,
    aerodynamicTerm,
    eto,
  };
}
