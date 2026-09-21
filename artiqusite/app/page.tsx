import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/sections/hero";
import { MaterialBand } from "@/components/sections/material-band";
import { WhatWeMake } from "@/components/sections/what-we-make";
import { WoodSlats } from "@/components/sections/wood-slats";
import { Process } from "@/components/sections/process";
import { Projects } from "@/components/sections/projects";
import { Testimonials } from "@/components/sections/testimonials";
import { Book } from "@/components/sections/book";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <MaterialBand />
        <WhatWeMake />
        <WoodSlats />
        <Process />
        <Projects />
        <Testimonials />
        <Book />
      </main>
      <Footer />
    </>
  );
}
