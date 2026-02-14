"use client"

import { useEffect, useRef } from "react"
import { initWebGPU } from "@/lib/webgpu/init"
import { createVideoTexture } from "@/lib/webgpu/video"
import { fullscreenQuadWGSL } from "@/lib/webgpu/shaders"

export function WebGPUCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    let device: GPUDevice
    let context: GPUCanvasContext
    let pipeline: GPURenderPipeline
    let bindGroup: GPUBindGroup
    let texture: GPUTexture
    let sampler: GPUSampler

    async function init() {
      const gpu = await initWebGPU()
      if (!gpu.supported) return

      device = gpu.device

      const canvas = canvasRef.current!
      context = canvas.getContext("webgpu")!

      const format = navigator.gpu.getPreferredCanvasFormat()
      context.configure({ device, format })

      const shader = device.createShaderModule({
        code: fullscreenQuadWGSL,
      })

      pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: shader, entryPoint: "vs" },
        fragment: {
          module: shader,
          entryPoint: "fs",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
      })

      sampler = device.createSampler({
        magFilter: "linear",
        minFilter: "linear",
      })

      const video = videoRef.current!
      await video.play()

      texture = createVideoTexture(
        device,
        video.videoWidth,
        video.videoHeight
      )

      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: texture.createView() },
          { binding: 1, resource: sampler },
        ],
      })

      function frame() {
        const videoFrame = new VideoFrame(video)

        device.queue.copyExternalImageToTexture(
          { source: videoFrame },
          { texture },
          {
            width: video.videoWidth,
            height: video.videoHeight,
          }
        )

        videoFrame.close()

        const encoder = device.createCommandEncoder()
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              loadOp: "clear",
              clearValue: { r: 0, g: 0, b: 0, a: 1 },
              storeOp: "store",
            },
          ],
        })

        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(6)
        pass.end()

        device.queue.submit([encoder.finish()])
        requestAnimationFrame(frame)
      }

      frame()
    }

    init()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <input
        type="file"
        accept="video/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) videoRef.current!.src = URL.createObjectURL(file)
        }}
      />

      <video ref={videoRef} muted playsInline className="hidden" />

      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="border border-gray-700 rounded"
      />
    </div>
  )
}

