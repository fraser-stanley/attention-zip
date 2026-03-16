import { Effect } from "postprocessing";
import { Color, Uniform, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget } from "three";

/**
 * Dithering shader — 4x4 Bayer matrix ordered dithering
 * Based on https://github.com/niccolofanton/dithering-shader
 */
const fragmentShader = /* glsl */ `
  uniform vec2 resolution;
  uniform float gridSize;
  uniform float pixelSizeRatio;
  uniform float grayscaleOnly;
  uniform vec3 ditherColor;
  uniform float time;
  uniform float greenChance;
  uniform vec3 greenColor;

  // Simple hash for pseudo-random per-pixel
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  bool getValue(float brightness, vec2 pos) {
    if (brightness > 16.0 / 17.0) return false;
    if (brightness < 1.0 / 17.0) return true;

    vec2 pixel = floor(mod(pos.xy / gridSize, 4.0));
    int x = int(pixel.x);
    int y = int(pixel.y);

    if (x == 0) {
      if (y == 0) return brightness < 16.0 / 17.0;
      if (y == 1) return brightness < 5.0 / 17.0;
      if (y == 2) return brightness < 13.0 / 17.0;
      return brightness < 1.0 / 17.0;
    } else if (x == 1) {
      if (y == 0) return brightness < 8.0 / 17.0;
      if (y == 1) return brightness < 12.0 / 17.0;
      if (y == 2) return brightness < 4.0 / 17.0;
      return brightness < 9.0 / 17.0;
    } else if (x == 2) {
      if (y == 0) return brightness < 14.0 / 17.0;
      if (y == 1) return brightness < 2.0 / 17.0;
      if (y == 2) return brightness < 15.0 / 17.0;
      return brightness < 3.0 / 17.0;
    } else {
      if (y == 0) return brightness < 6.0 / 17.0;
      if (y == 1) return brightness < 10.0 / 17.0;
      if (y == 2) return brightness < 7.0 / 17.0;
      return brightness < 11.0 / 17.0;
    }
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 fragCoord = uv * resolution;
    float pixelSize = gridSize * pixelSizeRatio;
    vec2 pixelatedUV = floor(fragCoord / pixelSize) * pixelSize / resolution;
    vec3 baseColor = texture2D(inputBuffer, pixelatedUV).rgb;

    float luminance = dot(baseColor, vec3(1.0, 1.0, 1.0));

    if (grayscaleOnly > 0.0) {
      baseColor = vec3(luminance);
    }

    bool dithered = getValue(luminance, fragCoord);
    // Strictly binary: every pixel is either dither color or pure white
    vec3 dc = dithered ? ditherColor : vec3(1.0);

    // Rare green sparkle — smooth fade in/out per pixel
    if (dithered && greenChance > 0.0) {
      vec2 cell = floor(fragCoord / pixelSize);
      // Each pixel gets a unique phase offset and cycle speed
      float phase = hash(cell) * 6.2831; // 0–2π
      float speed = 0.4 + hash(cell + 99.0) * 0.6; // 0.4–1.0 Hz
      // Sine pulse: -1..1 → remap to 0..1, then sharpen so it's mostly off
      float wave = sin(time * speed + phase);
      float pulse = smoothstep(0.92, 1.0, wave); // only bright near peak
      // Use hash to select which pixels can ever be green
      float selection = hash(cell + 42.0);
      if (selection < greenChance && pulse > 0.0) {
        dc = mix(dc, greenColor, pulse);
      }
    }

    vec2 currentPixel = floor(fragCoord / pixelSize);
    vec2 originalPixel = floor(uv * resolution / pixelSize);
    baseColor = (currentPixel == originalPixel) ? dc : baseColor;

    outputColor = vec4(baseColor, 1.0);
  }
`;

export class DitherEffect extends Effect {
  constructor({
    gridSize = 4.0,
    pixelSizeRatio = 1.0,
    grayscaleOnly = false,
    color = "#222222",
    greenChance = 0.008,
    greenHex = "#3FFF00",
  }: {
    gridSize?: number;
    pixelSizeRatio?: number;
    grayscaleOnly?: boolean;
    color?: string;
    greenChance?: number;
    greenHex?: string;
  } = {}) {
    const c = new Color(color);
    const g = new Color(greenHex);
    const uniforms = new Map<string, Uniform>([
      ["resolution", new Uniform(new Vector2(1, 1))],
      ["gridSize", new Uniform(gridSize)],
      ["pixelSizeRatio", new Uniform(pixelSizeRatio)],
      ["grayscaleOnly", new Uniform(grayscaleOnly ? 1 : 0)],
      ["ditherColor", new Uniform(new Vector3(c.r, c.g, c.b))],
      ["time", new Uniform(0)],
      ["greenChance", new Uniform(greenChance)],
      ["greenColor", new Uniform(new Vector3(g.r, g.g, g.b))],
    ]);

    super("DitherEffect", fragmentShader, { uniforms });
  }

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
  ) {
    const res = this.uniforms.get("resolution")!.value as Vector2;
    res.set(inputBuffer.width, inputBuffer.height);
    this.uniforms.get("time")!.value = performance.now() / 1000;
  }
}
