export interface AdsterraTenantConfig {
  socialBar: string;
  native: {
    containerId: string;
    src: string;
  };
  banners: {
    "300x250": string;
    "728x90": string;
    "468x60": string;
    "320x50": string;
    "160x600": string;
  };
  midArticle?: {
    key: string;
    width: number;
    height: number;
  };
  midFeed?: {
    key: string;
    width: number;
    height: number;
  };
}

export const ADSTERRA_CONFIG: Record<string, AdsterraTenantConfig> = {
  jejutime: {
    socialBar: "https://pl29482513.effectivecpmnetwork.com/ff/4c/94/ff4c94f2be70d5f135bec2e03d391610.js",
    native: {
      containerId: "container-055aa9559be0d3784216da85175a7203",
      src: "https://pl29482512.effectivecpmnetwork.com/055aa9559be0d3784216da85175a7203/invoke.js",
    },
    banners: {
      "300x250": "055aa9559be0d3784216da85175a7203", 
      "728x90": "",
      "468x60": "",
      "320x50": "",
      "160x600": "47ab173deb697165d15ee8b162f04d23",
    },
    midArticle: {
      key: "9d6eb67243a0a0a49ad01beafe38cbef",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "9d6eb67243a0a0a49ad01beafe38cbef",
      width: 300,
      height: 250,
    },
  },
  voicejeju: {
    socialBar: "https://pl29489865.effectivecpmnetwork.com/04/9c/d4/049cd43b6d49b530ad7b97ab5f60155c.js",
    native: {
      containerId: "container-9c5ecdec78c05c286aa87cb118bfee5b",
      src: "https://pl29489864.effectivecpmnetwork.com/9c5ecdec78c05c286aa87cb118bfee5b/invoke.js",
    },
    banners: {
      "300x250": "9c5ecdec78c05c286aa87cb118bfee5b",
      "728x90": "",
      "468x60": "",
      "320x50": "",
      "160x600": "b283cf02940081bd261a4fb0c9e177cf",
    },
    midArticle: {
      key: "d68b3e9b0c05a075a85176317f822b6d",
      width: 320,
      height: 50,
    },
    midFeed: {
      key: "d68b3e9b0c05a075a85176317f822b6d",
      width: 320,
      height: 50,
    },
  },
  jejujapan: {
    socialBar: "https://pl29490730.effectivecpmnetwork.com/cc/97/c5/cc97c581e8b030bb16b4a17aa655753.js",
    native: {
      containerId: "container-27355cfc0fde55009d791fc6d3c64eab",
      src: "https://pl29490729.effectivecpmnetwork.com/27355cfc0fde55009d791fc6d3c64eab/invoke.js",
    },
    banners: {
      "300x250": "1fb741744640f553c4ecca8c51760a9c",
      "728x90": "fbea14ce8e17eab5ecd5cbe56080b4d8",
      "468x60": "644ca3a6cee6d42619f89aa605de0fff",
      "320x50": "602d9cb0808e633aef4296c57c8e46cc",
      "160x600": "aecf1c3327f26cf4cd57e415bb8706ab",
    },
    midArticle: {
      key: "1fb741744640f553c4ecca8c51760a9c",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "1fb741744640f553c4ecca8c51760a9c",
      width: 300,
      height: 250,
    },
  },
};

/**
 * Resolves the tenant key based on domain or hostname
 */
export function getAdsterraTenant(domain: string): "jejujapan" | "voicejeju" | "jejutime" {
  const normalized = domain.toLowerCase();
  if (normalized.includes("jejujapan")) return "jejujapan";
  if (normalized.includes("voicejeju")) return "voicejeju";
  return "jejutime";
}
