"use client"

import { useEffect, useRef } from "react"
import { initWebGPU } from "@/lib/webgpu/init"

export function WebGPUCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let device: GPUDevice | null = null

    async function setup() {
      const gpu = await initWebGPU()
      if (!gpu.supported) {
        console.error(gpu.reason)
        return
      }

      device = gpu.device

      const canvas = canvasRef.current
      if (!canvas) return

      // 1. Get WebGPU canvas context
      const context = canvas.getContext("webgpu")
      if (!context) {
        console.error("Failed to get WebGPU context")
        return
      }

      // 2. Configure swap chain
      const format = navigator.gpu.getPreferredCanvasFormat()

      context.configure({
        device,
        format,
        alphaMode: "opaque",
      })

      // 3. Create command encoder
      const encoder = device.createCommandEncoder()

      // 4. Begin render pass (clear screen)
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      })

      pass.end()

      // 5. Submit commands
      device.queue.submit([encoder.finish()])
    }

    setup()

    return () => {
      device?.destroy()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      className="border border-gray-700 rounded-md"
    />
  )
}

