/**
 * Crop coefficient (Kc) สำหรับอ้อยพันธุ์ KK3 (§2.5)
 * Kc แปรตามระยะเจริญเติบโตโดย interpolation เชิงเส้นในช่วง development และ late season
 * ควรตั้งเป็น configuration เช่นเดียวกับพารามิเตอร์อื่น
 */
export const KC_STAGES = {
  plantCrop: [
    { stage: 'initial', days: 35, kcStart: 0.4, kcEnd: 0.4 },
    { stage: 'development', days: 60, kcStart: 0.4, kcEnd: 1.25 },
    { stage: 'mid', days: 190, kcStart: 1.25, kcEnd: 1.25 },
    { stage: 'late', days: 75, kcStart: 1.25, kcEnd: 0.75 },
  ], // รวม ≈ 360 วัน
  ratoon: [
    { stage: 'initial', days: 25, kcStart: 0.4, kcEnd: 0.4 },
    { stage: 'development', days: 70, kcStart: 0.4, kcEnd: 1.25 },
    { stage: 'mid', days: 135, kcStart: 1.25, kcEnd: 1.25 },
    { stage: 'late', days: 50, kcStart: 1.25, kcEnd: 0.75 },
  ], // รวม ≈ 280 วัน
};
