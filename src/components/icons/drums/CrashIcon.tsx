import type { SVGProps } from "react";

const CrashIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <ellipse cx="12" cy="8" rx="8" ry="3"/>
        <path d="M4 8v1a8 3 0 0 0 16 0V8"/>
        <path d="M12 12v8"/>
        <path d="M8 20h8"/>
    </svg>
);

export default CrashIcon;
