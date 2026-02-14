import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
      <h1 className="text-4xl font-bold">AI Video Editor</h1>
      <Button>Start Editing</Button>
    </main>
  )
}

