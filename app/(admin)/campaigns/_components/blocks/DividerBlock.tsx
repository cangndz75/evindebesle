"use client";

import { Block } from "../../types";

interface DividerBlockProps {
    block: Block;
}

export default function DividerBlock({ block }: DividerBlockProps) {
    const lineColor = block.style.lineColor || "#e5e7eb";
    const lineWidth = block.style.lineWidth || 1;
    const lineStyle = block.style.lineStyle || "solid";
    const paddingY = block.style.paddingY || 24;
    const backgroundColor = block.style.backgroundColor || "transparent";
    const widthPercent = block.style.widthPercent || 100;

    return (
        <div
            className="flex justify-center"
            style={{
                backgroundColor,
                paddingTop: paddingY,
                paddingBottom: paddingY,
                paddingLeft: 16,
                paddingRight: 16,
            }}
        >
            <hr
                style={{
                    width: `${widthPercent}%`,
                    borderTop: `${lineWidth}px ${lineStyle} ${lineColor}`,
                    borderBottom: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    margin: 0,
                }}
            />
        </div>
    );
}
