import type { SVGProps } from "react";

const Tom2Icon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="10" rx="6" ry="2.5"/>
        <path d="M6 10v4a6 2.5 0 0 0 12 0v-4"/>
        <path d="M12 14v6"/>
        <path d="m9 20-2-2"/>
        <path d="m15 20 2-2"/>
    </svg>
);

export default Tom2Icon;
