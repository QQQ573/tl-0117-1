# 送考线路调度监控看板

高考送考线路实时调度监控看板——为县教体局调度室提供 23 条送考线路的「计划时间带 × 实际 GPS」叠层可视化。

## 本地开发

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

## 生产构建

```bash
npm run build
npm run preview
```

## Docker 部署

```bash
npm run build
docker compose up -d
```

启用 Mock API：

```bash
docker compose --profile mock up -d
```

## 线路采样 Schema

### GpsSample

| 字段 | 类型 | 说明 |
|------|------|------|
| routeId | string | 线路 ID，关联 Route.id |
| timestamp | string | 采样时间，HH:mm 格式 |
| speed | number | 瞬时速度 km/h |
| lng | number | 经度 |
| lat | number | 纬度 |
| roadCondition | string | 路况：畅通/缓行/拥堵/施工路段/事故路段 |

### BusRoute

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 线路唯一标识 |
| vehicleNo | string | 车牌号 |
| examCenterId | string | 考点 ID |
| hasSpecialStudent | boolean | 是否含特殊考生 |
| plannedDepart | string | 计划发车时间 HH:mm |
| plannedArriveStart | string | 计划到达窗口起始 HH:mm |
| plannedArriveEnd | string | 计划到达窗口结束 HH:mm |
| color | string | 线路对应颜色 HEX |

### DelayEvent

| 字段 | 类型 | 说明 |
|------|------|------|
| routeId | string | 线路 ID |
| segmentStart | string | 晚点区间起始 HH:mm |
| segmentEnd | string | 晚点区间结束 HH:mm |
| delayMinutes | number | 晚点分钟数 |
| isReported | boolean | 是否已报备暴雨封路 |
| type | string | 晚点类型：堵车/司机误点/其他 |
| recentSamples | GpsSample[] | 最近采样记录 |

## 色带与折线字段对照

| 图表元素 | 数据来源 | 映射字段 | 说明 |
|----------|----------|----------|------|
| 半透明色带（计划到达窗） | BusRoute | plannedArriveStart → plannedArriveEnd | 纵轴对应线路，横轴为时间窗，alpha=0.25 |
| 实线折线（GPS 实际） | GpsSample | timestamp → speed | 叠加于色带之上，绿色实线+圆点 |
| 橙色色带（晚点区间） | DelayEvent | segmentStart → segmentEnd | 当色带与折线分离>8min 时触发 |
| 灰色色带（已报备） | DelayEvent | isReported=true 时 | 保留原始晚点记录，仅视觉变灰 |

## 技术栈

- Vue 3 + TypeScript + Vite
- ECharts 5 自定义 series（renderItem 实现色带叠层）
- Pinia 状态管理（筛选态、晚点标签态、报备态）
- Tailwind CSS
- 窗口 resize 防抖 280ms
- iPad 竖屏只读模式
