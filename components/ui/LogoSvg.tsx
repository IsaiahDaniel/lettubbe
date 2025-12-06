import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface LogoSvgProps {
  width?: number;
  height?: number;
  scale?: number;
}

const LogoSvg: React.FC<LogoSvgProps> = ({
  width = 40,
  height = 39,
  scale = 1
}) => {
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <Svg
      width={scaledWidth}
      height={scaledHeight}
      viewBox="0 0 317 308"
      fill="none"
    >
      {/* Purple shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.7254 130.866L114.863 130.864C144.377 135.37 138.874 177.854 113.565 179.007H105.027L99.7799 188.419L90.0488 179.009L20.1627 179.01C-6.3885 175.155 -6.90326 134.724 19.7254 130.866Z"
        fill="#AF4DFF"
      />

      {/* Pink shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M105.701 28.6623L155.699 71.1771C174.266 95.0376 142.412 121.885 121.13 104.977L74.1625 65.004C58.2273 43.7026 81.8304 15.502 105.701 28.6623Z"
        fill="#E0005A"
      />

      {/* Green shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M125.096 202.207L75.7615 244.153C60.0432 267.078 87.76 292.476 110.289 277.997L158.715 236.815C173.925 216.988 148.861 187.829 125.096 202.207Z"
        fill="#00D47B"
      />

      {/* Orange vertical shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M180.192 283.97L180.197 251.809C184.58 222.161 224.286 222.94 228.127 250.221L228.126 284.473C228.126 313.453 182.05 315.933 180.192 283.97Z"
        fill="#F7AD00"
      />

      {/* Green shape (right side) */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M315.163 240.068C303.703 241.55 286.9 245.186 277.046 238.19C271.774 234.446 268.22 230.066 266.479 225.285C263.364 216.736 265.608 207.331 271.09 201.049C278.944 192.048 293.688 187.949 307.214 199.918C319.372 210.676 314.572 225.294 315.163 240.068Z"
        fill="#00D47B"
      />

      {/* Purple top shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M180.04 58.4881L180.175 21.7568C183.337 -10.777 228.447 -3.37819 228.325 21.3429L228.184 47.4009L235.031 49.082L228.184 57.5349C224.688 83.8076 183.261 83.0097 180.04 58.4881Z"
        fill="#AF4DFF"
      />

      {/* Orange circle */}
      <Circle
        cx="291.671"
        cy="92.5873"
        r="23.0665"
        fill="#F7AD00"
      />

      {/* Blue triangle/play shape */}
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M189.409 189.395L251.993 153.246C254.668 151.726 254.883 151.819 251.831 150.125L189.232 114.001C186.58 112.445 186.553 112.211 186.612 115.701L186.625 187.976C186.604 191.05 186.416 191.191 189.409 189.395Z"
        fill="#00BEFF"
      />

      {/* dark stroke line */}
      <Path
        d="M204.618 29.9766V48.7143"
        stroke="#000A24"
        strokeWidth="5.33329"
        strokeMiterlimit="22.9256"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* dark dots */}
      <Circle cx="204.57" cy="254.089" r="5.11" fill="#000A24" />
      <Circle cx="204.57" cy="269.555" r="5.11" fill="#000A24" />
      <Circle cx="204.57" cy="285.021" r="5.11" fill="#000A24" />
    </Svg>
  );
};

export default LogoSvg;