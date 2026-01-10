import type { SVGProps } from "react";

const PercIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M14 6a2 2 0 1 0-4 0"/>
        <path d="M12 8v10"/>
        <path d="M10 18h4"/>
        <circle cx="12" cy="12" r="10"/>
    </svg>
);

export default PercIcon;
