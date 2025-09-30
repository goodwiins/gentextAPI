import React from "react";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { SparklesCore } from "@/components/ui/sparkles";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { Meteors } from "@/components/ui/meteors";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { IconHome, IconMessage, IconUser } from "@tabler/icons-react";

const testimonials = [
  {
    quote: "This quiz generator has transformed how I create educational content.",
    name: "Sarah Johnson",
    title: "Teacher",
  },
  {
    quote: "The AI-powered questions are incredibly relevant and engaging.",
    name: "Mike Chen",
    title: "Course Creator",
  },
  {
    quote: "Perfect for generating practice questions quickly and efficiently.",
    name: "Emily Davis",
    title: "Student",
  },
];

const navItems = [
  {
    name: "Home",
    link: "/",
    icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "About",
    link: "/about",
    icon: <IconUser className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
  {
    name: "Contact",
    link: "/contact",
    icon: <IconMessage className="h-4 w-4 text-neutral-500 dark:text-white" />,
  },
];

export default function AceternityDemo() {
  return (
    <div className="min-h-screen bg-black">
      <FloatingNav navItems={navItems} />
      
      {/* Aurora Background Section */}
      <AuroraBackground className="relative h-screen flex items-center justify-center">
        <div className="relative z-10 text-center">
          <h1 className="text-6xl font-bold text-white mb-4">
            Aceternity UI Demo
          </h1>
          <SparklesCore
            id="tsparticles"
            background="transparent"
            minSize={0.6}
            maxSize={1.4}
            particleDensity={100}
            className="w-full h-full absolute inset-0"
            particleColor="#FFFFFF"
          />
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore beautiful, interactive components powered by Aceternity UI
          </p>
        </div>
      </AuroraBackground>

      {/* 3D Cards Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            3D Interactive Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <CardContainer key={item} className="inter-var">
                <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[350px] h-auto rounded-xl p-6 border">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-neutral-600 dark:text-white"
                  >
                    Quiz Generator Feature {item}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="60"
                    className="text-neutral-500 text-sm max-w-sm mt-2 dark:text-neutral-300"
                  >
                    Experience the power of AI-driven quiz generation with beautiful, interactive components.
                  </CardItem>
                  <CardItem translateZ="100" className="w-full mt-4">
                    <div className="h-60 w-full bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg font-semibold">
                        Feature {item}
                      </span>
                    </div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            ))}
          </div>
        </div>
      </section>

      {/* Meteors Section */}
      <section className="relative py-20">
        <div className="relative h-96 bg-gray-900 rounded-lg mx-4 overflow-hidden">
          <Meteors number={20} />
          <div className="relative z-10 flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4">
                Meteor Shower Effect
              </h3>
              <p className="text-gray-300">
                Beautiful animated meteors for enhanced visual appeal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Moving Cards Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            What Users Say
          </h2>
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>
      </section>

      {/* Background Beams Section */}
      <section className="relative py-20 overflow-hidden">
        <BackgroundBeams />
        <div className="relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Background Beams
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Elegant animated background effects that add depth and movement to your pages
          </p>
        </div>
      </section>
    </div>
  );
}