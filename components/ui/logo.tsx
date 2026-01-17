import React from "react"

export function Logo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    const maskId = React.useId()

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            fill="none"
            className={className}
            {...props}
        >
            <defs>
                <mask id={maskId}>
                    {/* Base: Visible White */}
                    <rect width="100" height="100" fill="white" />

                    {/* Cutout: Black shape representing the Arrow's "Halo" */}
                    {/* This cuts the "K" where the arrow and its gap will be */}
                    {/* We draw a thick line for the arrow shaft + gap width */}

                    {/* Shaft Cutout */}
                    <path
                        d="M15 85 L85 15"
                        stroke="black"
                        strokeWidth="32"
                        strokeLinecap="square"
                    />
                </mask>
            </defs>

            {/* The K Structure */}
            <g mask={`url(#${maskId})`}>
                {/* Vertical Stem */}
                {/* Simple thick bar */}
                <rect x="20" y="10" width="22" height="80" rx="4" fill="currentColor" />

                {/* Bottom Diagonal Leg */}
                {/* Thicker shape connecting to stem */}
                <path
                    d="M35 55 L70 90 H95 L55 50 Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinejoin="round"
                />
            </g>

            {/* The Arrow (Purple) */}
            <g>
                {/* Shaft */}
                <path
                    d="M20 80 L75 25"
                    stroke="#8b5cf6"
                    strokeWidth="20"
                    strokeLinecap="square"
                />

                {/* Arrow Head */}
                <path
                    d="M55 25 H85 V55"
                    stroke="#8b5cf6"
                    strokeWidth="20"
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    fill="none"
                />
            </g>
        </svg>
    )
}
