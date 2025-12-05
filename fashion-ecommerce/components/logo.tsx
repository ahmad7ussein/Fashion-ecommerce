import { Sparkles } from "lucide-react"

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-2xl">
          <Sparkles className="h-6 w-6 text-black" />
        </div>
        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-black animate-pulse" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-2xl font-bold tracking-tight text-white">Style</span>
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Craft</span>
      </div>
    </div>
  )
}

export function LogoCompact({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-white to-gray-300 flex items-center justify-center shadow-lg">
          <Sparkles className="h-5 w-5 text-black" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border border-black" />
      </div>
      <span className="text-xl font-bold tracking-tight text-white">
        Style<span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Craft</span>
      </span>
    </div>
  )
}
