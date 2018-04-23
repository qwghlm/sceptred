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

/* istanbul ignore next */
export function webglEnabled() {
    try {
        var canvas = document.createElement('canvas');
        return !!(('WebGLRenderingContext' in window) && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    }
    catch (e) {
        return false;
    }
}

export function getFullScreenFunction() {
    const requestNames = [
        'requestFullscreen',
        'webkitRequestFullscreen',
        'mozRequestFullScreen',
        'msRequestFullscreen',
    ];
    for (var i=0; i<requestNames.length; i++) {
        if (requestNames[i] in document.documentElement) {
            return requestNames[i];
        }
    }
    return false;
}

export function getFullScreenPrefix() {
    const functionName = getFullScreenFunction();
    if (functionName === false) {
        return false;
    }
    return functionName.substring(0, functionName.toLowerCase().indexOf('request'));
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

// Debounces a function so it is only called every `wait` seconds
export function debounce(func: (...args: any[]) => void, wait = 50) {
  let h: number;
  return (...args: any[]) => {
    clearTimeout(h);
    h = window.setTimeout(() => func.apply(null, args), wait);
  };
}

// A performance-measuring function
var lastTime;
export function checkPerformance(msg? : string) {
    if (msg) {
        console.log(msg + ` took ${(performance.now() - lastTime).toFixed(1)}ms`)
    }
    lastTime = performance.now();
}
