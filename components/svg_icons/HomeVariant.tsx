import { SVGProps } from "react";

export function HomeVariant(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      {...props}
    >
      <path fill="currentColor" d="m12 3l8 6v12h-5v-7H9v7H4V9z"></path>
    </svg>
  );
}
