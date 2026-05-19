# Adsterra Integrations & Dynamic Multi-Tenant Monetization Plan

This reference plan serves as the architectural specification and implementation record for the dynamic multi-tenant Adsterra monetization model deployed across **JejuJapan**, **JejuTime**, and **VoiceJeju**.

---

## 1. Centralized Tenant Configuration System

To avoid script collisions and enforce layout compliance, all keys, scripts, containers, and ad dimensions are managed centrally.

> [!NOTE]
> **Intrusive Ads Removal**: Both the Popunder and Social Bar (popup notification bar) scripts have been fully removed from the global layout (`src/app/layout.tsx`) across all three sites (JejuJapan, JejuTime, and VoiceJeju) to ensure a premium, non-intrusive user experience.

### 📄 `src/config/adsterra.ts`
*   **Role**: Single source of truth for ad campaigns, keys, containers, and dimensions.
*   **Structure**: Every tenant defines specialized `banners`, `midArticle`, and `midFeed` config parameters:
    ```typescript
    export const ADSTERRA_CONFIG: Record<string, AdsterraTenantConfig> = {
      jejutime: {
        socialBar: "https://pl29482522.effectivecpmnetwork.com/a4/bc/99/a4bc99cb9c0dbba84dfd0f8d07f33d7b.js",
        native: {
          containerId: "container-055aa9559be0d3784216da85175a7203",
          src: "https://pl29482512.effectivecpmnetwork.com/055aa9559be0d3784216da85175a7203/invoke.js",
        },
        banners: {
          "300x250": "9d6eb67243a0a0a49ad01beafe38cbef",
          "728x90": "aba00b63b5a389e5d2af90b014ec46c7",
          "468x60": "f43b5973d25d0c609c5967198688e794",
          "320x50": "f43b5973d25d0c609c5967198688e794",
          "160x600": "3cfb57bb9ef31ab9cfd7b271d49e19d9",
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
      // ... same mapping for voicejeju and jejujapan
    };
    ```

---

## 2. Shared High-Performance SPA Native Banner Loader

### 📄 `src/components/ads/AdsterraNativeBanner.tsx`
*   **Role**: Renders dynamic, responsive sponsored recommendation blocks.
*   **Hydration / SPA Fix**: Programmatically creates, configures, and appends the script tag inside the target container inside a React `useEffect` callback:
    ```typescript
    useEffect(() => {
      if (!config) return;

      const container = document.getElementById(config.containerId);
      if (container) {
        container.innerHTML = ""; // Prevent duplicate injection
      }

      const script = document.createElement("script");
      script.src = config.src;
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      container?.appendChild(script);

      return () => {
        if (container) {
          container.innerHTML = ""; // Cleanup on unmount
        }
      };
    }, [config?.containerId, config?.src]);
    ```
    This completely bypasses script caching issues during internal Next.js/React Router client-side page transitions, making sure ads render every time on both home pages and articles.

---

## 3. Dynamic Mid-Feed/Mid-Article Placements

To prevent layout breakages and adapt to structural typography differences, each portal renders optimized ads in its central content sections.

### 📄 Mid-Feed Placements (Landing Pages)
Landing pages load `midFeed` configurations from `ADSTERRA_CONFIG` to render layout-specific dimensions:
*   **JejuJapan**: Renders `300x250` Box ad dynamically using config key `1fb7...`.
*   **JejuTime**: Renders `300x250` Box ad dynamically using config key `9d6e...`.
*   **VoiceJeju**: Renders a lightweight, high-contrast mobile `320x50` banner dynamically using config key `d68b...`.

### 📄 Mid-Article Placements (Details Pages)
The long-form article page components (`JejuJapanArticle`, `JejuTimeArticle`, `VoiceJejuArticle`) calculate article midpoint and dynamically inject the configured `midArticle` specifications directly:
```tsx
{midArticleConfig && (
  <div className="my-8 flex justify-center w-full">
     <AdsterraBanner 
       bannerKey={midArticleConfig.key} 
       width={midArticleConfig.width} 
       height={midArticleConfig.height} 
       className="!my-0" 
     />
  </div>
)}
```

---

## 4. Standardized Gutter Skyscrapers

Skyscraper elements (`160x600`) are placed symmetrically on wide screen viewports (`min-[1650px]`) and optimized with standard offsets:
*   **Sticky Offset**: Sits sticky under the header using `top-40` (`160px`).
*   **Layout Boundaries**: Wrapped inside elements bound by `top-32` and `bottom-32` parent markers to prevent overlapping the website headers or absolute bottom footers.
