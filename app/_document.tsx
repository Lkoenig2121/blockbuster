import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload fonts */}
        <link
          rel="preload"
          href="/_next/static/media/caa3a2e1cccd8315-s.p.16t1db8_9y2o~.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link
          rel="preload"
          href="/_next/static/media/797e433ab948586e-s.p.0.q-h669a_dqa.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}