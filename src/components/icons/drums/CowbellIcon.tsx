import type { SVGProps } from "react";

const CowbellIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M6 10v2a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-2"/>
        <path d="M6 10l-2.5-2.5"/>
        <path d="M18 10l2.5-2.5"/>
        <path d="M8 10V6a4 4 0 0 1 8 0v4"/>
    </svg>
);

export default CowbellIcon;
