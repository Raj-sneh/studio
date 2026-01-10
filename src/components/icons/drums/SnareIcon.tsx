import type { SVGProps } from "react";

const SnareIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="11" rx="8" ry="3"/>
        <path d="M4 11v3a8 3 0 0 0 16 0v-3"/>
        <path d="m5 12.5 14-1"/>
        <path d="m5.5 15 13-1"/>
    </svg>
);

export default SnareIcon;
