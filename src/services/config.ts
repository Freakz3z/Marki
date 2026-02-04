export interface AppConfig {
  githubRepo?: string;
  branch?: string;
  siteTitle?: string;
  navbarTitle?: string;
  logoPath?: string;
  faviconPath?: string;
}

let config: AppConfig = {
    siteTitle: 'HNNU-Wiki',
    navbarTitle: 'HNNU-Wiki'
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
