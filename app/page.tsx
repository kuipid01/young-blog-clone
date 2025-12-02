
import { FeaturesSection } from "../components/feature-section"
import { HeroSection } from "../components/hero-section"
import { Footer } from "../components/footer"
import { ScrollToTop } from "../components/scroll-to-top"
import { SolutionsSection } from "../components/solution-section"

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <SolutionsSection />
      <Footer />
      <ScrollToTop />
    </main>
  )
}
