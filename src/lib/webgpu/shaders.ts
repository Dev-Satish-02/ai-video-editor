export const fullscreenQuadWGSL = /* wgsl */ `
struct VSOut {
  @builtin(position) pos : vec4<f32>,
  @location(0) uv : vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) i : u32) -> VSOut {
  var pos = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2( 1.0,  1.0),
  );

  var uv = array<vec2<f32>, 6>(
    vec2(0.0, 1.0),
    vec2(1.0, 1.0),
    vec2(0.0, 0.0),
    vec2(0.0, 0.0),
    vec2(1.0, 1.0),
    vec2(1.0, 0.0),
  );

  var out : VSOut;
  out.pos = vec4(pos[i], 0.0, 1.0);
  out.uv = uv[i];
  return out;
}

struct FilterParams {
  brightness : f32,
  contrast : f32,
  grayscale : f32,
};

@group(0) @binding(0)
var videoTex : texture_2d<f32>;

@group(0) @binding(1)
var videoSampler : sampler;

@group(0) @binding(2)
var<uniform> params : FilterParams;

fn applyGrayscale(color: vec3<f32>) -> vec3<f32> {
  let luma = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(color, vec3(luma), params.grayscale);
}

fn applyBrightness(color: vec3<f32>) -> vec3<f32> {
  return color + params.brightness;
}

fn applyContrast(color: vec3<f32>) -> vec3<f32> {
  return (color - 0.5) * params.contrast + 0.5;
}

@fragment
fn fs(in : VSOut) -> @location(0) vec4<f32> {
  var color = textureSample(videoTex, videoSampler, in.uv).rgb;

  color = applyBrightness(color);
  color = applyContrast(color);
  color = applyGrayscale(color);

  return vec4(color, 1.0);
}
`
