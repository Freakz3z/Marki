export interface AppConfig {
  mode?: 'local' | 'remote';
  githubRepo?: string;
  branch?: string;
  localDocsFolder?: string; // 本地模式中文档所在的文件夹名称（仅用于本地模式）
  siteTitle?: string;
  navbarTitle?: string;
  logoPath?: string;
  faviconPath?: string;
}

let config: AppConfig = {
    siteTitle: 'Marki',
    navbarTitle: 'Marki'
};
let configLoaded = false;

export const loadConfig = async () => {
  if (configLoaded) return config;
  try {
    const res = await fetch('/settings.json');
    if (res.ok) {
        const data = await res.json();
        config = { ...config, ...data };
        
        // Update document title
        if (config.siteTitle) {
            document.title = config.siteTitle;
        }

        // Update favicon
        if (config.faviconPath) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = config.faviconPath;
        }
    }
  } catch (e) {
    console.error("Failed to load settings.json", e);
  }
  configLoaded = true;
  return config;
};

export const getConfig = () => config;
