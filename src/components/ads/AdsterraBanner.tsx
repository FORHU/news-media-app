"use client";

interface AdsterraBannerProps {
  bannerKey: string;
  width: number;
  height: number;
  className?: string;
}

export function AdsterraBanner({ bannerKey, width, height, className = "" }: AdsterraBannerProps) {
  // Using an iframe with srcDoc completely isolates the Adsterra script from the Next.js React tree.
  // This prevents hydration errors, document.write errors, and global "atOptions" variable conflicts
  // when rendering multiple banners on the same page.
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; overflow: hidden; }</style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : '${bannerKey}',
            'format' : 'iframe',
            'height' : ${height},
            'width' : ${width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="//www.highperformanceformat.com/${bannerKey}/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div className={`flex justify-center items-center w-full my-6 overflow-hidden ${className}`}>
      <iframe
        srcDoc={html}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        style={{ border: "none", overflow: "hidden", display: "block" }}
        title={`Adsterra Banner ${width}x${height}`}
      />
    </div>
  );
}
