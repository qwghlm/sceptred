// Feature detection
export function isMobile() {
    return window.matchMedia("(max-width: 640px)").matches;
}
export function isTouch() {
    return 'ontouchstart' in window || !!navigator.maxTouchPoints;
}
export function isRetina() {
    return window.devicePixelRatio && window.devicePixelRatio > 1.3;
}

// http://youmightnotneedjquery.com/
export function extend(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;

    for (var key in arguments[i]) {
      /* istanbul ignore else  */
      if (arguments[i].hasOwnProperty(key)) {
          out[key] = arguments[i][key];
      }
    }
  }
  return out;
}
