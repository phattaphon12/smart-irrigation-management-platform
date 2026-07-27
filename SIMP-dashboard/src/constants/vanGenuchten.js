/**
 * Van Genuchten (1980) soil water retention (§2.3)
 *
 * สำคัญ: ชุดนี้ "ปรับเทียบกับ treatment" (เม.ย. 2569) ไม่ใช่ค่าจากตาราง Saxton & Rawls
 * (α = 0.019, n = 1.31) เพราะค่าจากตารางให้ %AWC เกิน 100% แทบทุกจุด ใช้เป็น trigger ไม่ได้
 * ยังอยู่ในสถานะ "ประมาณ" จนกว่าจะได้ผลวิเคราะห์ดินจากห้องปฏิบัติการ — ห้าม hardcode ที่อื่น
 * ให้ import จากไฟล์นี้เท่านั้น
 */
export const VAN_GENUCHTEN = {
  thetaR: 0.04, // θ_r — ประมาณ
  thetaS: 0.42, // θ_s — ประมาณ
  alpha: 0.118, // α (1/kPa) — ประมาณ
  n: 1.64, // n — ประมาณ
};

// m = 1 − 1/n (คำนวณ)
export const VG_M = 1 - 1 / VAN_GENUCHTEN.n;

// θ_fc ที่ |ψ| = 33 kPa, θ_wp ที่ |ψ| = 1500 kPa (คำนวณ — ดู soilMoisture.js:vwcFromKpa)
export const FIELD_CAPACITY_VWC = 0.193;
export const WILTING_POINT_VWC = 0.0538;

// AWC = θ_fc − θ_wp (คำนวณ)
export const AVAILABLE_WATER_CAPACITY = FIELD_CAPACITY_VWC - WILTING_POINT_VWC; // 0.1391

/** เกณฑ์การให้น้ำ (§3.5) — ใช้ kPa เป็นเกณฑ์สัมบูรณ์, ไม่ใช้ %AWC (ขึ้นกับ VG ที่ยังประมาณอยู่) */
export const IRRIGATION_TRIGGERS = [
  { treatment: 'T1', label: 'Depletion 25%', kpaTrigger: -30, adcThresholdApprox: 2745 },
  { treatment: 'T2', label: 'Depletion 50%', kpaTrigger: -60, adcThresholdApprox: 2032 },
  { treatment: 'T3', label: 'Depletion 75%', kpaTrigger: -100, adcThresholdApprox: 1575 },
];
