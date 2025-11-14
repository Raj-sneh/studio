import type { SVGProps } from "react";

const MonogramLogo = (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        {...props}
    >
        <path d="M17.5 4.5a7.5 7.5 0 0 0-11-2" />
        <path d="M6.5 19.5a7.5 7.5 0 0 1 11 2" />
        <path d="M12 2.5v19" />
    </svg>
);

export default MonogramLogo;
