# Sugarcane Field Monitor — React Dashboard

Dashboard ตรวจติดตามความชื้นดิน (Watermark 200SS + ESP32-H2) และ Evapotranspiration
(FAO-56 Penman-Monteith) สำหรับแปลงอ้อย Sa Bua Kam แปลงเป็น React (Vite) จาก
`sugarcane_dashboard_v3.html` เดิม ตามเอกสารอ้างอิง `dev_reference_sensor_et_v1.md`

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env   # แล้วแก้ค่าตามต้องการ (ดูหัวข้อ "การเชื่อมต่อ Ambient Weather API")
npm run dev
```

เปิด http://localhost:5173

```bash
npm run build     # build production ไปที่ dist/
npm run preview   # preview build
```

## โครงสร้างโปรเจกต์

```
src/
  constants/            ← ค่าคงที่ทั้งหมดจากเอกสารอ้างอิง (§2) แก้ไขที่นี่จุดเดียว
    fieldConstants.js      lat/lon/elevation/timezone/planting date
    sensorConstants.js     ADC/R_divider/Shock-Seddigh coefficients
    vanGenuchten.js        θr/θs/α/n (treatment-calibrated — ไม่ใช่ Saxton-Rawls)
    faoConstants.js        wind factor, solar constant, albedo, Stefan-Boltzmann
    cropCoefficients.js    Kc ตามระยะเจริญเติบโต (KK3, plant crop / ratoon)
    chartLayout.js         ขนาด/margin ของกราฟ SVG

  lib/
    calculations/         ← ฟังก์ชันคำนวณล้วน (pure functions), มี unit-verified กับ checkpoint ในเอกสาร
      soilMoisture.js        ADC → R → kPa → VWC → %AWC (§3)
      radiation.js            Rs (trapezoidal), Ra, Rso, Rn (§4.3-4.4)
      evapotranspiration.js   ETo แบบ FAO-56 Penman-Monteith (§4.4)
      cropWaterUse.js         DAP, Kc interpolation, ETc (§4.5)
    api/
      ambientWeatherClient.js  เรียก Ambient Weather API (pagination, rate-limit, gap handling) (§4.1)
      dailyAggregation.js      รวมข้อมูลดิบ 1 นาที → รายวัน (Tmax/Tmin/Rs/ฯลฯ) (§4.2-4.3)
      soilNodeClient.js        placeholder สำหรับ pipeline A (ยังไม่มี API กลางตามเอกสาร)

  data/                  ← ข้อมูล mock (port มาจากไฟล์ HTML เดิม เพื่อพัฒนา UI ได้ทันที)
    mockSoilNodes.js
    mockWeatherSummary.js
    mockWaterBalance.js

  hooks/                 ← เชื่อม data source (mock/live) เข้ากับ UI state
    useSoilNodesData.js     โหลดโหนดเซนเซอร์ (mock หรือ live ถ้าตั้ง VITE_SOIL_API_BASE_URL)
    useWeatherData.js       โหลด ETo/ETc/rain (mock หรือ live ถ้าตั้ง VITE_USE_LIVE_WEATHER=true)
    useNodeSelection.js     state การเลือกโหนด + view mode (kpa/vwc/awc)
    useWeatherSeriesToggle.js  toggle ETo/ETc/Rain + cumulative mode
    useTimelineLabels.js    รวมแกนเวลาจากทุกชุดข้อมูล

  components/
    layout/     Header, TopNav, Sidebar
    filters/    ViewModeToggle, NodeFilterPanel, ZoneDepthControls, SeriesToggle
    charts/     SoilTensionChart, EvapotranspirationChart, WaterBalanceChart, ChartTooltip
    battery/    BatteryGrid, BatteryLevelChart

  pages/
    GraphDashboardPage.jsx   หน้า "📊 Graph Dashboard" (chart 1-3 + sidebar)
    BatteryStatusPage.jsx    หน้า "🔋 Battery Status Monitor" (chart 4)

  utils/        svgScale.js, nodeColors.js, formatters.js, batteryStatus.js — helper ทั่วไป, ไม่ผูกกับ business logic

  App.jsx, main.jsx, index.css
```

## หลักการออกแบบ

- **ค่าคงที่แยกจากตรรกะเสมอ** — ทุกค่าที่เอกสารระบุว่า "ประมาณ" (Van Genuchten, สัมประสิทธิ์ Shock & Seddigh,
  Kc) อยู่ใน `src/constants/` เท่านั้น ไม่ hardcode ปนกับสูตรคำนวณ เพื่อแก้ทีเดียวเมื่อมีค่าคาลิเบรตใหม่
  (เช่น หลังผลวิเคราะห์ดินจากห้องแล็บออก)
- **calculations เป็น pure function** — ไม่แตะ DOM/state ทดสอบแยกได้ ตรวจสอบแล้วว่าให้ค่าตรงกับ
  checkpoint ในเอกสารทุกจุด (ดูหัวข้อถัดไป)
- **data source แยกจาก UI ผ่าน hooks** — component ไม่รู้ว่าข้อมูลมาจาก mock หรือ live API, สลับได้ด้วย
  environment variable โดยไม่ต้องแก้ component

## ตรวจสอบความถูกต้องของการคำนวณ (เทียบ checkpoint ในเอกสาร §3.4 และ §4.6)

รันแล้วได้ค่าตรงกับเอกสารทุกจุด:

| ADC | kPa (คาดหวัง) | ผลจาก `soilMoisture.js` |
|-----|---------------|--------------------------|
| 2646 | −33.0 | −33.0 |
| 2032 | −60.0 | −60.0 |
| 1575 | −100.0 | −100.0 |

| ค่า | คาดหวัง (§4.6) | ผลจาก `evapotranspiration.js` |
|-----|-----------------|--------------------------------|
| u2 | 0.382 | 0.382 |
| Δ | 0.20158 | 0.20158 |
| Ra | 28.86 | 28.86 |
| ETo | 2.965 mm/วัน | 2.965 mm/วัน |
| Kc (DAP 327) | 0.970 | 0.970 |

**สำคัญ**: ข้อมูล mock ใน `src/data/mockWeatherSummary.js` (port จากไฟล์ HTML เดิม) เป็นตัวอย่างสำหรับ
พัฒนา UI เท่านั้น — เอกสารเตือนว่าไฟล์ dashboard รุ่นก่อนหน้าฝัง ETo/ETc ที่คำนวณด้วยวิธี sum อย่างง่าย
(ไม่ใช่ trapezoidal) ทำให้ค่าเฉลี่ยต่ำกว่าจริง (ETo≈2.79 แทนที่จะเป็น 3.62) เมื่อเปิดโหมด live
(`VITE_USE_LIVE_WEATHER=true`) แอปจะคำนวณด้วย `src/lib/calculations` ที่ยืนยันตรง checkpoint แล้วแทน
ไม่ใช่ค่าจากไฟล์ mock

## การเชื่อมต่อ Ambient Weather API (pipeline B — สภาพอากาศ/ET)

1. คัดลอก `.env.example` เป็น `.env`
2. ใส่ `VITE_AMBIENT_API_KEY`, `VITE_AMBIENT_APPLICATION_KEY` (จาก https://ambientweather.net/account)
   และ `VITE_AMBIENT_STATION_MAC`
3. ตั้ง `VITE_USE_LIVE_WEATHER=true`
4. `npm run dev`

**⚠️ คำเตือนด้านความปลอดภัย**: `src/lib/api/ambientWeatherClient.js` เรียก API ตรงจาก browser
เพื่อความง่ายในการพัฒนา/สาธิต วิธีนี้จะ expose apiKey/applicationKey ให้ผู้ใช้เห็นได้ผ่าน network tab
**ก่อนขึ้น production ควรทำ backend หรือ serverless proxy** เก็บ key ไว้ฝั่ง server แล้วให้ frontend
เรียก proxy แทน ไม่ควร deploy .env ที่มี key จริงขึ้น static hosting

Client จัดการตามกติกาที่เอกสารระบุไว้แล้ว:
- delay ≥1.3 วินาทีต่อ request (rate limit 1 req/วิ) และ retry แบบ backoff เมื่อเจอ HTTP 429
- ดึง `lastData.dateutc` ก่อนเสมอ ก่อน paginate ย้อนหลัง
- jump-back 1 วันเมื่อเจอ 0 records (สถานี offline) และหยุดเมื่อว่างติดกัน ~30 วัน

## Pipeline A (โหนดเซนเซอร์ความชื้นดิน) — ยังไม่มี API กลาง

เอกสารอ้างอิงระบุแค่การประมวลผลระดับ node (ADC → kPa → VWC → %AWC ทุก 15 นาที) แต่ไม่มี endpoint
กลางสำหรับดึงข้อมูลทุกโหนดพร้อมกัน `src/lib/api/soilNodeClient.js` เป็น adapter ที่วางโครงไว้ล่วงหน้า —
เมื่อทีม backend มี endpoint แล้ว ให้ตั้ง `VITE_SOIL_API_BASE_URL` และแก้ฟังก์ชัน `fetchSoilNodeSeries`
ให้ตรงกับ response จริง โดยไม่ต้องแก้ component หรือ hook อื่น (ใช้ shape เดียวกับ mock data)

## ข้อควรทราบเกี่ยวกับข้อมูล (§5 ของเอกสาร)

- Node 10 (poor contact), 12 (spike), 14 (dry) — ถูกทำเครื่องหมาย `flagged: true` ในข้อมูล, กราฟจะวาด
  เส้นจางลงและเป็นเส้นประให้อัตโนมัติ
- Node 30 เป็น spare ไม่ active — ถูกตัดออกจาก "All Nodes" โดยดีฟอลต์ (ยังเลือกเองได้จาก node grid)
- ค่า VWC/%AWC เป็น relative indicator (พารามิเตอร์ Van Genuchten ยัง "ประมาณ") ส่วน kPa ใช้เป็นเกณฑ์
  ให้น้ำแบบสัมบูรณ์ได้ทันที — ดู `IRRIGATION_TRIGGERS` ใน `src/constants/vanGenuchten.js`
