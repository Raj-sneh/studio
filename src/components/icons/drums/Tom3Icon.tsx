import type { SVGProps } from "react";

const Tom3Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="9" rx="5" ry="2"/>
        <path d="M7 9v4a5 2 0 0 0 10 0V9"/>
        <path d="M12 13v7"/>
        <path d="m8 20-2-2"/>
        <path d="m16 20 2-2"/>
    </svg>
);

export default Tom3Icon;
