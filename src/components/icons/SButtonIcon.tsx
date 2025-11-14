import type { SVGProps } from "react";

const SButtonIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M17.5 4.5c-2.5 2.5-2.5 6.5 0 9s6.5 2.5 9 0" transform="matrix(0.70710678, 0.70710678, -0.70710678, 0.70710678, -4.125621, 9.874379)"/>
    <path d="M6.5 19.5c2.5-2.5 2.5-6.5 0-9s-6.5-2.5-9 0" transform="matrix(0.70710678, 0.70710678, -0.70710678, 0.70710678, 9.874379, -4.125621)"/>
  </svg>
);

export default SButtonIcon;
