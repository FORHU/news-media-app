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
    socialBar: "", // no pop ups
    native: {
      containerId: "container-055aa9559be0d3784216da85175a7203",
      src: "https://pl29482512.effectivecpmnetwork.com/055aa9559be0d3784216da85175a7203/invoke.js",
    },
    banners: {
      "300x250": "9d6eb67243a0a0a49ad01beafe38cbef",
      "728x90": "aba00b63b5a389e5d2af90b014ec46c7",
      "468x60": "",
      "320x50": "f43b5973d25d0c609c5967198688e794",
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
    socialBar: "", // no pop ups
    native: {
      containerId: "container-9c5ecdec78c05c286aa87cb118bfee5b",
      src: "https://pl29489864.effectivecpmnetwork.com/9c5ecdec78c05c286aa87cb118bfee5b/invoke.js",
    },
    banners: {
      "300x250": "1fc758c95674c51a8dc1e7bdff580f7e",
      "728x90": "c242943e75df6497a5929d27852b1159",
      "468x60": "",
      "320x50": "d68b3e9b0c05a075a85176317f822b6d",
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
    socialBar: "", // no pop ups
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
  newsicons: {
    socialBar: "", // no pop ups
    native: {
      containerId: "container-a1f442b3c1c6f4884e945ce6943d9592",
      src: "https://pl29635876.effectivecpmnetwork.com/a1f442b3c1c6f4884e945ce6943d9592/invoke.js",
    },
    banners: {
      "300x250": "4f9542538a51a6a78a44d2adbd421aba",
      "728x90": "94250b076539ed0b9dcd58f165dd3025",
      "468x60": "603c44961b8019fd5a624765debe12f3",
      "320x50": "dd0e7786a644f40208798a12ab5f9d69",
      "160x600": "615d4c292020f1ed98e5d7177ea0d623",
      "160x300": "19bf3dd4b01f2176cacbd0a9e8bb33b1",
    },
    midArticle: {
      key: "4f9542538a51a6a78a44d2adbd421aba",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "4f9542538a51a6a78a44d2adbd421aba",
      width: 300,
      height: 250,
    },
  },
  lavaguetech: {
    socialBar: "", // no pop ups
    native: {
      containerId: "container-398d6339f61784cfe4f8cc8a17e43de4",
      src: "https://pl29657489.effectivecpmnetwork.com/398d6339f61784cfe4f8cc8a17e43de4/invoke.js",
    },
    banners: {
      "300x250": "0f5d8e0a761677efc2fad90689aec418",
      "728x90": "f44e47d0bf2a544eab96a65ba93616c8",
      "468x60": "615d4c292020f1ed98e5d7177ea0d623",
      "320x50": "98f09d1cf2d083b14dfe37d26654000d",
      "160x600": "f63cf63618dbcf56722bfe599c1389b2",
      "160x300": "559be2cd879b81846a24781fae5314d3",
    },
    midArticle: {
      key: "0f5d8e0a761677efc2fad90689aec418",
      width: 300,
      height: 250,
    },
    midFeed: {
      key: "0f5d8e0a761677efc2fad90689aec418",
      width: 300,
      height: 250,
    },
  },
};

/**
 * Resolves the tenant key based on domain or hostname
 */
export function getAdsterraTenant(domain: string): "jejujapan" | "voicejeju" | "jejutime" | "jejuqq" | "skyblueprime" | "newsicons" | "lavaguetech" {
  const normalized = domain.toLowerCase();
  if (normalized.includes("jejujapan")) return "jejujapan";
  if (normalized.includes("voicejeju")) return "voicejeju";
  if (normalized.includes("jejuqq")) return "jejuqq";
  if (normalized.includes("skyblueprime")) return "skyblueprime";
  if (normalized.includes("newsicons")) return "newsicons";
  if (normalized.includes("lavaguetech")) return "lavaguetech";
  return "jejutime";
}
