import React from 'react';
import Svg, { Rect, Circle, Line, Path, G } from 'react-native-svg';

interface Props {
  size?: number;
}

export default function Logo({ size = 80 }: Props) {
  const s = size;
  const amber = '#F59E0B';
  const bg = '#0F0F10';
  const subtle = '#F59E0B55';

  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      {/* Background */}
      <Rect x="0" y="0" width="100" height="100" rx="22" fill={bg} />

      {/* Outer ring — clock face */}
      <Circle cx="50" cy="46" r="26" stroke={amber} strokeWidth="3" fill="none" />

      {/* Tick marks at 12, 3, 6, 9 */}
      <Line x1="50" y1="22" x2="50" y2="26" stroke={amber} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="74" y1="46" x2="70" y2="46" stroke={amber} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="50" y1="70" x2="50" y2="66" stroke={amber} strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="26" y1="46" x2="30" y2="46" stroke={amber} strokeWidth="2.5" strokeLinecap="round" />

      {/* Minute hand — pointing to 12 */}
      <Line x1="50" y1="46" x2="50" y2="27" stroke={amber} strokeWidth="3" strokeLinecap="round" />

      {/* Hour hand — pointing to ~2 (10:10 style right side) */}
      <Line x1="50" y1="46" x2="63" y2="54" stroke={amber} strokeWidth="3.5" strokeLinecap="round" />

      {/* Center dot */}
      <Circle cx="50" cy="46" r="3" fill={amber} />

      {/* Log lines at bottom */}
      <Rect x="26" y="81" width="16" height="3" rx="1.5" fill={amber} />
      <Rect x="26" y="87" width="48" height="3" rx="1.5" fill={subtle} />
      <Rect x="26" y="93" width="34" height="3" rx="1.5" fill={subtle} />
    </Svg>
  );
}
