export function KipuLogo({
  className,
  color = "#f59e0b",
  background = "#0a0a0a",
}: {
  className?: string;
  color?: string;
  background?: string;
}) {
  return (
    <span aria-hidden className={`inline-flex ${className ?? ""}`}>
      <svg
        viewBox="0 0 362 374"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Kipu"
      >
        <rect width="362" height="374" fill={background} />
        <g fill={color} transform="translate(54 58) scale(0.7)">
          <path d="M220 221 L181 265 L256 373 L331 373 L252 263 Z" />
          <path d="M362 1 L229 43 L261 69 L118 233 L103 211 L70 245 L117 322 L305 108 L336 138 Z" />
          <path d="M0 0 L0 373 L60 373 L60 240 L118 181 L132 200 L172 155 L126 93 L61 159 L61 0 Z" />
        </g>
      </svg>
    </span>
  );
}