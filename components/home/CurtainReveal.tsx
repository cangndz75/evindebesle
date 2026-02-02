"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface CurtainRevealProps {
    children: React.ReactNode[];
}

export default function CurtainReveal({ children }: CurtainRevealProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const sections = gsap.utils.toArray<HTMLElement>(".reveal-section");

            if (!sections.length) return;

            // Pin the container
            ScrollTrigger.create({
                trigger: containerRef.current,
                start: "top top",
                end: `+=${(sections.length - 1) * 100}%`,
                pin: true,
                scrub: true,
            });

            // Animate each section (except the last one)
            sections.forEach((section, index) => {
                if (index === sections.length - 1) return;

                gsap.to(section, {
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: `${index * (100 / (sections.length - 1))}% top`,
                        end: `${(index + 1) * (100 / (sections.length - 1))}% top`,
                        scrub: 1,
                    },
                    y: "-100%", // Section physically moves upward
                    ease: "power2.inOut",
                });
            });
        },
        { scope: containerRef }
    );

    return (
        <div ref={containerRef} className="relative w-full overflow-hidden h-screen bg-black">
            {children.map((child, index) => (
                <div
                    key={index}
                    className="reveal-section absolute inset-0 w-full h-full"
                    style={{ zIndex: children.length - index }}
                >
                    {child}
                </div>
            ))}
        </div>
    );
}
