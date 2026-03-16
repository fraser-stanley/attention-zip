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
  }: {
    gridSize?: number;
    pixelSizeRatio?: number;
    grayscaleOnly?: boolean;
    color?: string;
  } = {}) {
    const c = new Color(color);
    const uniforms = new Map<string, Uniform>([
      ["resolution", new Uniform(new Vector2(1, 1))],
      ["gridSize", new Uniform(gridSize)],
      ["pixelSizeRatio", new Uniform(pixelSizeRatio)],
      ["grayscaleOnly", new Uniform(grayscaleOnly ? 1 : 0)],
      ["ditherColor", new Uniform(new Vector3(c.r, c.g, c.b))],
    ]);

    super("DitherEffect", fragmentShader, { uniforms });
  }

  update(
    _renderer: WebGLRenderer,
    inputBuffer: WebGLRenderTarget,
  ) {
    const res = this.uniforms.get("resolution")!.value as Vector2;
    res.set(inputBuffer.width, inputBuffer.height);
  }
}
