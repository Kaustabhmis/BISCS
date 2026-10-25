import { OrganizationSchema } from '../components/OrganizationSchema'
import { Seo } from '../components/Seo'
import { HeroSection } from '../components/hero/HeroSection'
import { BrandCarousel } from '../components/home/BrandCarousel'
import { CompanyIntro } from '../components/home/CompanyIntro'
import { Testimonials } from '../components/home/Testimonials'
import { CtaBand } from '../components/ui/CtaBand'
import { site } from '../config/site'

export default function HomePage() {
  return (
    <>
      <Seo {...site.seo.pages.home} path="/" />
      <OrganizationSchema />
      <HeroSection />
      <CompanyIntro />
      <BrandCarousel />
      <Testimonials />
      <CtaBand />
    </>
  )
}
