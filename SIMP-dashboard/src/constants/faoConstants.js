/**
 * ค่าคงที่ ETo ตาม FAO-56 (§2.4) — เป็นค่ามาตรฐานทั้งหมด
 */
export const FAO_CONSTANTS = {
  /** Wind speed correction factor ที่ z_w = 2.7 m (FAO-56 Eq.47) — ใช้ 0.9402 ไม่ใช่ 0.9387 */
  windFactorAt2_7m: 0.9402,
  /** Solar constant Gsc (MJ/m²·min) */
  solarConstant: 0.082,
  /** Stefan-Boltzmann constant */
  stefanBoltzmann: 4.903e-9,
  /** Albedo ของหญ้าอ้างอิง */
  referenceAlbedo: 0.23,
};
