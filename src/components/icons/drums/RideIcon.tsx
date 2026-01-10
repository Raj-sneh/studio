import type { SVGProps } from "react";

const RideIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="8" rx="7" ry="2"/>
        <path d="M5 8v1a7 2 0 0 0 14 0V8"/>
        <path d="M12 10v10"/>
        <path d="M8 20h8"/>
        <circle cx="12" cy="6" r="1"/>
    </svg>
);

export default RideIcon;
