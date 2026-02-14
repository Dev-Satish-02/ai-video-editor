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

@group(0) @binding(0)
var videoTex : texture_2d<f32>;

@group(0) @binding(1)
var videoSampler : sampler;

@fragment
fn fs(in : VSOut) -> @location(0) vec4<f32> {
  return textureSample(videoTex, videoSampler, in.uv);
}
`

