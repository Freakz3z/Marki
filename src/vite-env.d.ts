/// <reference types="vite/client" />

// CSS modules support
declare module '*.css' {
  const content: string;
  export default content;
}

// highlight.js styles
declare module 'highlight.js/styles/*.css' {
  const content: string;
  export default content;
}
