import argparse
import datetime
import os
import random
import sys


def stars(rng, w, h, n, color, opacity=0.7):
    out = []
    for _ in range(n):
        x = rng.randint(10, w - 10)
        y = rng.randint(10, h - 10)
        r = round(rng.uniform(0.8, 1.8), 2)
        out.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" opacity="{opacity}"/>')
    return "\n".join(out)


def cloud(rng, cx, cy, rx, ry, color):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{color}" filter="url(#blur3)"/>'


def night_svg(name, motto, seed):
    rng = random.Random(seed)
    w, h = 600, 800
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="85%">
      <stop offset="0%" stop-color="#1a1440"/>
      <stop offset="55%" stop-color="#0d0a26"/>
      <stop offset="100%" stop-color="#050310"/>
    </radialGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#7c6cff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#a78bfa" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#7c6cff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="46%">
      <stop offset="0%" stop-color="#8b7bff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#8b7bff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5eead4"/>
      <stop offset="50%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#f472b6"/>
    </linearGradient>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    <filter id="glowf" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#bg)"/>
  <g opacity="0.7">
{stars(rng, w, h, 14, "#ffffff")}
  </g>
  <circle cx="300" cy="420" r="190" fill="url(#glow)" filter="url(#glowf)"/>
  <g stroke="url(#line)" stroke-width="1" fill="none" opacity="0.55">
    <path d="M0 650 Q 120 620 190 655 T 340 640 T 470 660 T 600 645"/>
    <path d="M0 690 Q 100 670 180 695 T 330 680 T 480 700 T 600 685"/>
    <path d="M0 730 Q 130 710 210 735 T 360 720 T 500 740 T 600 725"/>
  </g>
  <g stroke="#a78bfa" stroke-width="1" fill="none" opacity="0.92">
    <path d="M300 140 Q 330 190 320 230"/>
    <path d="M300 140 Q 270 190 280 230"/>
    <path d="M320 230 Q 300 245 280 230"/>
    <path d="M280 230 Q 285 250 300 260"/>
    <path d="M320 230 Q 315 250 300 260"/>
    <path d="M300 260 L 300 300"/>
    <path d="M210 300 Q 150 330 140 400"/>
    <path d="M390 300 Q 450 330 460 400"/>
    <path d="M140 400 Q 200 430 255 440"/>
    <path d="M460 400 Q 400 430 345 440"/>
    <path d="M255 440 Q 300 460 345 440"/>
  </g>
  <g fill="#c4b5fd">
    <circle cx="300" cy="222" r="3"/>
    <circle cx="336" cy="216" r="2.6"/>
    <circle cx="264" cy="216" r="2.6"/>
  </g>
  <g stroke="#7c6cff" stroke-width="0.8" fill="none" opacity="0.6">
    <path d="M264 216 L 336 216"/>
    <path d="M262 240 Q 300 250 338 240"/>
  </g>
  <g stroke="#8b7bff" stroke-width="1" fill="none" opacity="0.9">
    <circle cx="300" cy="420" r="120"/>
    <circle cx="300" cy="420" r="132" stroke-dasharray="3 8" opacity="0.5"/>
    <circle cx="300" cy="420" r="146" stroke-dasharray="1 6" opacity="0.35"/>
  </g>
  <g font-family="monospace" font-size="10" fill="#5eead4" opacity="0.85">
    <text x="295" y="286">01</text>
    <text x="428" y="415">10</text>
    <text x="295" y="570">01</text>
    <text x="160" y="415">10</text>
  </g>
  <text x="300" y="620" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#e2d9ff" letter-spacing="8">{name}</text>
  <text x="300" y="652" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#8b7bff" letter-spacing="4">{motto}</text>
</svg>'''


def dawn_svg(name, motto, seed):
    rng = random.Random(seed)
    w, h = 600, 800
    clouds = []
    for _ in range(5):
        cx = rng.randint(80, 520)
        cy = rng.randint(130, 300)
        rx = rng.randint(100, 170)
        ry = rng.randint(18, 32)
        color = rng.choice(["#fff1f2", "#ffe4e6", "#ffedd5"])
        clouds.append(cloud(rng, cx, cy, rx, ry, color))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e1065"/>
      <stop offset="35%" stop-color="#9d174d"/>
      <stop offset="60%" stop-color="#fb7185"/>
      <stop offset="80%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
    <radialGradient id="aura" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#fff7ed" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="#fed7aa" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#fed7aa" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef3c7" stop-opacity="0.95"/>
      <stop offset="50%" stop-color="#fcd34d" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#fb923c" stop-opacity="0.85"/>
    </linearGradient>
    <filter id="blur8" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
    <filter id="blur3" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#sky)"/>
  <circle cx="300" cy="360" r="240" fill="url(#aura)" filter="url(#blur8)"/>
  <g opacity="0.5">
{chr(10).join(clouds)}
  </g>
  <g stroke="#fde68a" stroke-width="2" fill="none" opacity="0.7">
    <path d="M300 640 L 180 720"/>
    <path d="M300 640 L 300 730"/>
    <path d="M300 640 L 420 720"/>
    <path d="M300 640 L 90 690"/>
    <path d="M300 640 L 510 690"/>
  </g>
  <circle cx="300" cy="360" r="130" fill="url(#body)"/>
  <g stroke="#fbbf24" stroke-width="2" fill="none" opacity="0.8">
    <path d="M300 250 Q 340 290 338 330"/>
    <path d="M300 250 Q 260 290 262 330"/>
    <path d="M338 330 Q 300 348 262 330"/>
    <path d="M262 330 Q 268 352 300 368"/>
    <path d="M338 330 Q 332 352 300 368"/>
    <path d="M300 368 L 300 470"/>
    <path d="M215 380 Q 180 430 185 500"/>
    <path d="M385 380 Q 420 430 415 500"/>
    <path d="M185 500 Q 240 522 300 530 Q 360 522 415 500"/>
  </g>
  <g fill="#7c2d12">
    <circle cx="300" cy="322" r="4"/>
    <circle cx="340" cy="316" r="3.4"/>
    <circle cx="260" cy="316" r="3.4"/>
  </g>
  <path d="M260 316 Q 300 300 340 316" stroke="#7c2d12" stroke-width="2" fill="none" opacity="0.7"/>
  <path d="M272 350 Q 300 368 328 350" stroke="#92400e" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.9"/>
  <text x="300" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="#fff7ed" letter-spacing="8">{name}</text>
  <text x="300" y="732" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="16" fill="#fde68a" letter-spacing="4">{motto}</text>
</svg>'''


def main():
    ap = argparse.ArgumentParser(description="portrait studio: night | dawn")
    ap.add_argument("--theme", choices=["night", "dawn"], required=True)
    ap.add_argument("--name", default="ТИТУС")
    ap.add_argument("--motto", default="memini ergo sum")
    ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int, default=None)
    args = ap.parse_args()

    seed = args.seed if args.seed is not None else random.randint(1, 9999)
    svg = night_svg(args.name, args.motto, seed) if args.theme == "night" else dawn_svg(args.name, args.motto, seed)

    out_path = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"OK {out_path} (seed={seed})")


if __name__ == "__main__":
    main()