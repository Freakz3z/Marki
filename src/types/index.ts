export interface NavItem {
  title: string;
  path: string;
  children?: NavItem[];
}

export interface DocMetadata {
  title?: string;
  lastModified?: string;
  [key: string]: any;
}

export interface DocContent {
  path: string;
  content: string;
  metadata: DocMetadata;
}
