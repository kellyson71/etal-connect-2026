import plans from "./principal-plan.json";
export type IndoorTarget = { floor: number; zoneId: string };
export function getRoom(floor: number, zoneId: string) {
  const plan = plans.floors.find((p) => p.level === floor);
  const zone = plan?.zones.find((z) => z.id === zoneId);
  if (!plan || !zone)
    throw new Error(`Unknown indoor target: ${floor}/${zoneId}`);
  return {
    plan,
    zone,
    label: zone.label,
    floorLabel: plan.label,
    useLabel: zone.useLabel,
  };
}
export function roomPreviewBox(target: IndoorTarget) {
  const { zone } = getRoom(target.floor, target.zoneId);
  const shape = zone as typeof zone & {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    points?: string;
  };
  let x = shape.x ?? 0,
    y = shape.y ?? 0,
    w = shape.w ?? 0,
    h = shape.h ?? 0;
  if (shape.points) {
    const pts = shape.points.split(" ").map((p) => p.split(",").map(Number));
    const xs = pts.map((p) => p[0]),
      ys = pts.map((p) => p[1]);
    x = Math.min(...xs);
    y = Math.min(...ys);
    w = Math.max(...xs) - x;
    h = Math.max(...ys) - y;
  }
  const width = Math.max(w + 80, 210),
    height = Math.max(h + 60, width * 0.65);
  return `${x + w / 2 - width / 2} ${y + h / 2 - height / 2} ${width} ${height}`;
}
