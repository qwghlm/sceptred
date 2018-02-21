import * as utils from '../lib/utils';

// Test browser detection

const chromeUA = "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36";
const firefoxUA = "Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:10.0) Gecko/20100101 Firefox/10.0";
const ie10UA = " Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)";
const ie11UA = "Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko";
const edgeUA = "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10136";

const iosBrowserUA = "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8H7 Safari";
const iosWebviewUA = "Mozilla/5.0 (iPad; U; CPU OS 4_3_2 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile";

const androidBrowserUA = "Mozilla/5.0 (Linux; Android 6.0.1; SM-G920V Build/MMB29K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.98 Mobile Safari/537.36";
const buzzFeedWebviewUA = "Mozilla/5.0 (Linux; Android 7.1.1; Android SDK built for x86 Build/NYC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36 buzzfeed/514003 (progressiveloading)";
const nonBuzzFeedWebviewUA = "Mozilla/5.0 (Linux; Android 7.1.1; Android SDK built for x86 Build/NYC; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Mobile Safari/537.36";

test('isiOSWebView() works properly', () => {
    window.navigator.userAgent = iosBrowserUA;
    expect(utils.isiOSWebView()).toBe(false);
    window.navigator.userAgent = iosWebviewUA;
    expect(utils.isiOSWebView()).toBe(true);
});

test('isAndroidWebView() works properly', () => {
    window.navigator.userAgent = androidBrowserUA;
    expect(utils.isAndroidWebView()).toBe(false);
    window.navigator.userAgent = buzzFeedWebviewUA;
    expect(utils.isAndroidWebView()).toBe(true);
    window.navigator.userAgent = nonBuzzFeedWebviewUA;
    expect(utils.isAndroidWebView()).toBe(true);
});

test('isFirefox() works properly', () => {
    window.navigator.userAgent = chromeUA;
    expect(utils.isFirefox()).toBe(false);
    window.navigator.userAgent = firefoxUA;
    expect(utils.isFirefox()).toBe(true);
});

test('isIE() works properly', () => {
    window.navigator.userAgent = chromeUA;
    expect(utils.isIE()).toBe(false);
    window.navigator.userAgent = ie10UA;
    expect(utils.isIE()).toBe(true);
    window.navigator.userAgent = ie11UA;
    expect(utils.isIE()).toBe(true);
    window.navigator.userAgent = edgeUA;
    expect(utils.isIE()).toBe(true);
});

// Test feature detection

test('isMobile() works properly', () => {
    expect(utils.isMobile()).toBe(false);
    window.resizeTo(320, 480);
    expect(utils.isMobile()).toBe(true);
});

test('isTouch() works properly', () => {
    expect(utils.isTouch()).toBe(false);
    Object.defineProperty(window, "ontouchstart", {
        value: jest.fn(),
    });
    expect(utils.isTouch()).toBe(true);
});

test('isRetina() works properly', () => {
    window.devicePixelRatio = 1;
    expect(utils.isRetina()).toBe(false);
    window.devicePixelRatio = 1.5;
    expect(utils.isRetina()).toBe(true);
});

// Test function manipulation functions

test('once() extends properly', () => {

    var callback = jest.fn();
    var onceCallback = utils.once(callback);
    onceCallback();
    expect(callback.mock.calls.length).toBe(1);
    onceCallback();
    expect(callback.mock.calls.length).toBe(1);
    callback();
    expect(callback.mock.calls.length).toBe(2);

});

// Test object manipulation functions

test('extend() extends properly', () => {
    expect(utils.extend({foo: "bar"}, {foo: "baz", bat: 'qux'}))
        .toEqual({foo: "baz", bat: 'qux'});
});

test('extend() is fine with null', () => {
    expect(utils.extend(null, {foo: "bar"}, {foo: "baz", bat: 'qux'}, null))
        .toEqual({foo: "baz", bat: 'qux'});
});

// Test array functions

// Test shuffle
test('shuffle() works', () => {

    const original = [...Array(100).keys()];
    var shuffled = utils.shuffle(original.slice());

    expect(shuffled)
        .not.toEqual(original);

    expect(shuffled.length)
        .toEqual(original.length);

    shuffled.sort((a, b) => a - b);
    expect(shuffled)
        .toEqual(original);

});

test('range() works', () => {

    expect(utils.range(10))
        .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    expect(utils.range(0, 10))
        .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

});

// Test class manipulation functions

// Convenience to fetch first div
let getDiv = () => document.getElementsByTagName('div')[0];

test('hasClass() works', () => {
    document.body.innerHTML = "<div class='foo'></div>";
    expect(utils.hasClass(getDiv(), 'foo')).toBe(true);
    expect(utils.hasClass(getDiv(), 'bar')).toBe(false);
});

test('addClass() works', () => {
    document.body.innerHTML = "<div></div>";
    expect(utils.hasClass(getDiv(), 'foo')).toBe(false);
    utils.addClass(getDiv(), 'foo');
    expect(utils.hasClass(getDiv(), 'foo')).toBe(true);
});

test('removeClass() works', () => {
    document.body.innerHTML = "<div class='foo'></div>";
    expect(utils.hasClass(getDiv(), 'foo')).toBe(true);
    utils.removeClass(getDiv(), 'foo');
    expect(utils.hasClass(getDiv(), 'foo')).toBe(false);
});
