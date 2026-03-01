import { WebGPUTest } from "@/components/WebGPUTest"
import { WebGPUCanvas } from "@/components/WebGPUCanvas"
import { VideoClipper } from "@/components/VideoClipper"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white">
      <h1 className="text-4xl font-bold">AI Video Editor</h1>

      <WebGPUTest />
      <WebGPUCanvas />
      <VideoClipper />
    </main>
  )
}

