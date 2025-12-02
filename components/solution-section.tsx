import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Facebook, Instagram, Twitter, Ghost, Twitch } from "lucide-react"

const solutions = [
  {
    icon: Facebook,
    name: "Facebook",
    description: "Quality Facebook service",
    iconBg: "bg-[#1877F2]",
  },
  {
    icon: Instagram,
    name: "Instagram",
    description: "Quality Instagram service",
    iconBg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
      </svg>
    ),
    name: "TikTok",
    description: "Quality Tiktok service",
    iconBg: "bg-black",
  },
  {
    icon: Twitter,
    name: "Twitter",
    description: "Quality Twitter service",
    iconBg: "bg-[#E91E63]",
  },
  {
    icon: Ghost,
    name: "Snapchat",
    description: "Quality Snapchat service",
    iconBg: "bg-[#FFFC00]",
    iconColor: "text-black",
  },
  {
    icon: Twitch,
    name: "Twitch",
    description: "Quality Twitch service",
    iconBg: "bg-[#9146FF]",
  },
]

export function SolutionsSection() {
  return (
    <section className="py-20 bg-[#6C5CE7]">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">Explore our solutions</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
          {solutions.map((solution, index) => (
            <Card key={index} className="bg-white/10 border-white/20 hover:bg-white/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-10 h-10 ${solution.iconBg} rounded-full flex items-center justify-center shrink-0`}>
                  {typeof solution.icon === "function" ? (
                    <solution.icon />
                  ) : (
                    //@ts-expect-error
                    <solution.icon className={`w-5 h-5 ${solution.iconColor || "text-white"}`} />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{solution.name}</h3>
                  <p className="text-white/70 text-sm">{solution.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Button className="bg-[#F5C842] hover:bg-[#E5B832] text-[#2D3436] font-semibold px-8 rounded-lg">
            Register
          </Button>
          <Button
            variant="outline"
            className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 rounded-lg"
          >
            Login
          </Button>
        </div>
      </div>
    </section>
  )
}
