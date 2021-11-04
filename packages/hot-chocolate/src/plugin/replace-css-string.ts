import type { SandboxHooks, Sandbox } from '../core/sandbox';

/**
 * font-face 示例
 * @font-face {
 *   font-family: "Open Sans";
 *   src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
 *      url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
 * }
 */

const sandboxFontStylesMap = new Map<Sandbox, HTMLStyleElement>();

const pathResolve = (
  path: string,
  relative: string
) => {
  const pathArray = path.split('/')
  const relativeArray = relative.split('/');

  pathArray.splice(-1);
  relativeArray.forEach((pathname) => {
    if (pathname === '..') {
      pathArray.splice(-1);
    } else if (pathname !== '.') {
      pathArray.push(pathname);
    }
  })
  return pathArray.join('/')
}

export function replaceCSSStringPlugin (hooks: SandboxHooks) {
  hooks.sandbox.register('mount', (end, sandbox) => {
    const fontFaceStyleElement = document.createElement('style');
    fontFaceStyleElement.setAttribute('sandbox-id', sandbox.id)
    document.head.appendChild(fontFaceStyleElement);
    sandboxFontStylesMap.set(sandbox, fontFaceStyleElement);
  })
  hooks.sandbox.register('replaceCSSString', (
    end,
    sandbox,
    cssString,
    cssUrl
  ) => {
    // console.log('replaceCSSString', cssString);
    cssString = cssString.replace(/:root/g, ':host');
    const fontFaceStyleElement = sandboxFontStylesMap.get(sandbox);
    const urlReg = /url\(("([^"]*)"|'([^']*)'|([^)]*))\)/g;
    const fontFaceReg = /@font-face\s*{[^}]*}/g;
    let fontFaceCSSString = '';
    cssString = cssString.replace(fontFaceReg, (fontFace) => {
      fontFaceCSSString += fontFace;
      return '';
    })
    if (fontFaceStyleElement) {
      const getCurrentUrl = (relativeUrl: string) => {
        if (
          cssUrl
          && relativeUrl[0] === '.'
        ) {
          return pathResolve(cssUrl, relativeUrl);
        }
        return sandbox.getRemoteURLWithHtmlRoot(relativeUrl);
      }

      fontFaceStyleElement.innerHTML = fontFaceStyleElement.innerHTML + fontFaceCSSString.replace(urlReg, (
        all,
        s1,
        s2,
        s3,
        s4
      ) => {
        if (s2) {
          return `url("${getCurrentUrl(s2)}")`;
        }
        if (s3) {
          return `url('${getCurrentUrl(s3)}')`;
        }
        if (s4) {
          return `url(${getCurrentUrl(s4)})`;
        }
        return all;
      })
    }

    return end(cssString);
  })
  hooks.sandbox.register('unmount', (end, sandbox) => {
    const fontFaceStyleElement = sandboxFontStylesMap.get(sandbox);
    if (fontFaceStyleElement) {
      fontFaceStyleElement.parentNode?.removeChild(fontFaceStyleElement);
    }
  })
}
