// Helper to calculate the Cubic Bezier point at time t (0 to 1) using the Mathematical Bezier Curve Equation.
export function getBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  return (
    (1 - t) ** 3 * p0 +
    3 * (1 - t) ** 2 * t * p1 +
    3 * (1 - t) * t ** 2 * p2 +
    t ** 3 * p3
  );
}
