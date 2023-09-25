precision highp float;

struct Wave {
  vec2 position;
  float progress;
};

uniform float uAspect;
uniform Wave uWaves[SIZE];
uniform sampler2D tImage;
uniform vec2 uCoveredScale;
uniform bool uDebug;

varying vec2 vUv;

const float PI = acos(-1.0);

float easeOutSine(float t) {
  return sin((t * PI) / 2.0);
}

vec2 wave(vec2 uv, Wave data) {
  float progress = data.progress;
  progress = easeOutSine(progress);
  
  float spread = progress + 2.0;
  vec2 pos = data.position * vec2(uAspect, 1.0);

  float dist = distance(uv, pos);

  float scaler = sin((dist - progress) * (20.0 / spread) - 9.5);
  scaler = smoothstep(0.0, 1.0, scaler);
  float edge = 0.008 * spread;

  float threshold = smoothstep(-edge + progress, edge + progress, dist + 0.1);
  threshold *= 1.0 - smoothstep(edge + progress, edge * 2.0 + progress, dist - 0.1);
  scaler *= threshold;
  
  float decay = 1.0 - smoothstep(0.0, 1.0, progress);
  scaler *= decay;

  vec2 velo = normalize(uv - pos);
  return velo * scaler;
}


void main() {
  vec2 aspect = vec2(uAspect, 1.0);
  vec2 centeredUv = vUv * 2.0 - 1.0;
  centeredUv *= aspect;

  int count = 0;
  vec2 velo = vec2(0);

  for(int i = 0; i < SIZE; i++) {
    Wave data = uWaves[i];
    if (0.9999 < data.progress) break;
    
    velo += wave(centeredUv, data);
    count += 1;
  }

  if (0 < count) {
    velo /= float(count);
  }

  vec3 scaler = vec3(length(velo));

  vec2 uv = (vUv - 0.5) * uCoveredScale + 0.5;

  float r = texture2D(tImage, uv - velo * 0.3 * 1.0).r;
  float g = texture2D(tImage, uv - velo * 0.3 * 1.4).g;
  float b = texture2D(tImage, uv - velo * 0.3 * 1.8).b;
  vec3 color = vec3(r, g, b);

  vec3 final = mix(color, scaler * 5.0, float(uDebug));

  gl_FragColor = vec4(final, 1.0);
}