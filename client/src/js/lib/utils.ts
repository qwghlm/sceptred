// Feature detection
/* istanbul ignore next */
export function isMobile() {
    return window.matchMedia("(max-width: 640px)").matches;
}
/* istanbul ignore next */
export function isTouch() {
    return 'ontouchstart' in window || !!navigator.maxTouchPoints;
}
/* istanbul ignore next */
export function isRetina() {
    return window.devicePixelRatio && window.devicePixelRatio > 1.3;
}

// http://youmightnotneedjquery.com/
export function extend(...args: any[]) {

  let out: any = args[0] || {};

  for (var i = 1; i < args.length; i++) {
    if (!args[i])
      continue;

    for (var key in args[i]) {
      /* istanbul ignore else  */
      if (args[i].hasOwnProperty(key)) {
          out[key] = args[i][key];
      }
    }
  }
  return out;
}

export function debounce(func: () => void, wait = 50) {
  let h: number;
  return () => {
    clearTimeout(h);
    h = setTimeout(() => func(), wait);
  };
}
