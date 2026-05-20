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
    "160x300"?: string;
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
  jejuqq: {
    socialBar: "", // no pop ups
    native: {
      containerId: "container-249d6e5263194c6c4d2cd786de3d20a3",
      src: "https://pl29491540.effectivecpmnetwork.com/249d6e5263194c6c4d2cd786de3d20a3/invoke.js",
    },
    banners: {
      "300x250": "0d641095120f1a94de002144a7ab6071",
      "728x90": "c44f7e113d44ecd1e176d1d5f7b0ea88",
      "468x60": "1f3fee34834b51851cdb8d28ff764667",
      "320x50": "3f85e849865490176ce92ad336244905",
      "160x600": "66034c1234e0e862f1ad53b987a30ab5",
    },
    midArticle: {
      key: "0d641095120f1a94de002144a7ab6071",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "0d641095120f1a94de002144a7ab6071",
      width: 300,
      height: 250,
    },
  },
  skyblueprime: {
    socialBar: "", // no pop ups
    native: {
      containerId: "container-16691c726849d64dc9b1001004730ef1",
      src: "https://pl29500719.effectivecpmnetwork.com/16691c726849d64dc9b1001004730ef1/invoke.js",
    },
    banners: {
      "300x250": "33b465dee4c8998d42422ca3a14329a6",
      "728x90": "",
      "468x60": "66ab6e2809dc938b175474b4535c6de9",
      "320x50": "f428a99acf351f72e9189c9141d176c8",
      "160x600": "",
      "160x300": "04e3f3a3edb146141b6e13a58245ef80",
    },
    midArticle: {
      key: "33b465dee4c8998d42422ca3a14329a6",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "33b465dee4c8998d42422ca3a14329a6",
      width: 300,
      height: 250,
    },
  },
};

/**
 * Resolves the tenant key based on domain or hostname
 */
export function getAdsterraTenant(domain: string): "jejujapan" | "voicejeju" | "jejutime" | "jejuqq" | "skyblueprime" {
  const normalized = domain.toLowerCase();
  if (normalized.includes("jejujapan")) return "jejujapan";
  if (normalized.includes("voicejeju")) return "voicejeju";
  if (normalized.includes("jejuqq")) return "jejuqq";
  if (normalized.includes("skyblueprime")) return "skyblueprime";
  return "jejutime";
}
