import type { SVGProps } from "react";

const HiHatOpenIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="8.5" rx="8" ry="1.5"/>
        <ellipse cx="12" cy="15.5" rx="8" ry="1.5"/>
        <path d="M12 10v5"/>
        <path d="M12 17v3"/>
        <path d="M8 20h8"/>
    </svg>
);

export default HiHatOpenIcon;
