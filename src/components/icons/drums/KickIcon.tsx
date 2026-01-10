import type { SVGProps } from "react";

const KickIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="8"/>
        <path d="m14 14-4-4"/>
        <path d="m10 14 4-4"/>
    </svg>
);

export default KickIcon;
