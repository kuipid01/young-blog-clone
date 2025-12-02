import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Lightbulb, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Settings,
    title: "Professional service",
    description:
      "Our team is always ready to assist you with selection, answer your questions, and provide you with all the necessary information about each of our items.",
    iconBg: "bg-[#6C5CE7]",
    iconColor: "text-white",
  },
  {
    icon: Lightbulb,
    title: "Wide range of options",
    description:
      "Regardless of your needs, we offer a variety of accounts with different numbers of followers and account ages. You can choose what best suits your goals.",
    iconBg: "bg-[#F5C842]",
    iconColor: "text-white",
  },
  {
    icon: BarChart3,
    title: "What sets us apart?",
    description:
      "Quality and verified accounts: We guarantee that every account offered in our store has undergone thorough validation. We are confident in the quality of what we offer and ensure the highest quality of our accounts.",
    iconBg: "bg-[#FF7675]",
    iconColor: "text-white",
  },
  {
    icon: ShieldCheck,
    title: "Secure Transactions",
    description:
      "Shop with confidence knowing that our platform prioritizes security. Your transactions are protected, and we facilitate a secure environment for both buyers and sellers.",
    iconBg: "bg-[#00CEC9]",
    iconColor: "text-white",
    highlighted: true,
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Feature Cards Grid */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`border ${
                  feature.highlighted
                    ? "bg-[#6C5CE7] text-white border-[#6C5CE7]"
                    : "border-gray-200 bg-white"
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                <CardContent className="p-6 space-y-4">
                  <div
                    className={`w-12 h-12 ${feature.iconBg} rounded-xl flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <h3
                    className={`font-semibold text-lg ${
                      feature.highlighted ? "text-white" : "text-[#2D3436]"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      feature.highlighted ? "text-white/80" : "text-gray-600"
                    }`}
                  >
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Right Side Content */}
          <div className="space-y-6 lg:pl-8">
            <p className="text-[#6C5CE7] font-medium">At Jemil Marketplace</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D3436] leading-tight text-balance">
              We focus on quality socials accounts.
            </h2>
            <p className="text-gray-600 leading-relaxed">
              At Jemil Marketplacemarketplace, we specialize in offering a wide
              selection of accounts that can be useful for various purposes,
              whether it's for marketing, brand promotion, newsletters, and much
              more.
            </p>
            <div className="flex gap-4 pt-4">
              <Button className="bg-[#6C5CE7] hover:bg-[#5B4ED6] text-white font-semibold px-8 rounded-lg">
                Register
              </Button>
              <Button
                variant="outline"
                className="border-2 border-[#2D3436] text-[#2D3436] hover:bg-gray-100 px-8 rounded-lg bg-transparent"
              >
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
