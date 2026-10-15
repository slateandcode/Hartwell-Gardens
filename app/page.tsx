import SmoothScroll from '@/components/providers/SmoothScroll'
import Nav from '@/components/Nav'
import Hero from '@/components/sections/Hero'
import About from '@/components/sections/About'
import Services from '@/components/sections/Services'
import Featured from '@/components/sections/Featured'
import Process from '@/components/sections/Process'
import Costs from '@/components/sections/Costs'
import Enquiry from '@/components/sections/Enquiry'
import Footer from '@/components/sections/Footer'

export default function Home() {
  return (
    <SmoothScroll>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Services />
        <Featured />
        <Process />
        <Costs />
        <Enquiry />
      </main>
      <Footer />
    </SmoothScroll>
  )
}
