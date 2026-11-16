/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react';

  export interface MdxProps {
    components?: Record<string, ComponentType<any>>;
  }

  const MDXContent: ComponentType<MdxProps>;
  export default MDXContent;
}
