export function createTextureFromRGBA(
  device: GPUDevice,
  width: number,
  height: number,
  data: Uint8Array
): GPUTexture {
  const texture = device.createTexture({
    size: { width, height },
    format: "rgba8unorm",
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  })

  device.queue.writeTexture(
    { texture },
    data,
    {
      bytesPerRow: width * 4,
    },
    {
      width,
      height,
    }
  )

  return texture
}

export function generateTestPattern(
  width: number,
  height: number
): Uint8Array {
  const data = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      data[i + 0] = Math.floor((x / width) * 255) // R
      data[i + 1] = Math.floor((y / height) * 255) // G
      data[i + 2] = 128 // B
      data[i + 3] = 255 // A
    }
  }

  return data
}

