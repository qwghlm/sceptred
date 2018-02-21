import * as base from '../lib/base';

const id = id;

// Before each test set up the document's HTML and set offsetWidth of the wrapper to something we can manipulate
beforeEach(() => {
    document.body.innerHTML = `<div id='${id}'><svg></svg></div>`;
    var wrapper = document.getElementById(id);
    Object.defineProperty(wrapper, 'offsetWidth', { value : 693, writable : true });
});

// Test Base View

test('BaseView loads & scrolls correctly', () => {

    jest.useFakeTimers();

    let view = new base.BaseView(id, {scrollTrigger : 500});

    // Mock for the getBoundingClientRect function
    let top = 600;
    view.wrapper.getBoundingClientRect = jest.fn(function() {
        return {
            top,
            bottom: top + 300,
        };
    });

    // Add a mock callback
    let callback = jest.fn();
    view.addScrollListener(callback);

    // Check to see scrollTrigger is set and not yet called
    expect(view.config.scrollTrigger).toBe(500);
    expect(callback).not.toHaveBeenCalled();

    // Simulate a scroll down, and check to see if called
    top = 400;
    window.dispatchEvent(new CustomEvent('scroll'));
    jest.runAllTimers();
    expect(callback).toHaveBeenCalled();

});

test('BaseView loads correctly without a scroll trigger', () => {

    let view = new base.BaseView(id, {scrollTrigger : false});
    expect(view.config.scrollTrigger).toBe(false);

    let callback = jest.fn();
    view.addScrollListener(callback);
    expect(callback).toHaveBeenCalled();

});

// Test D3 view

let aspectRatio = 0.8;
let mobileAspectRatio = 1.0;
let marginRatios = {
    left : 0.1,
    right : 0.1,
    top : 0.1,
    bottom : 0.1,
};
let mobileMarginRatios = {
    left : 0.2,
    right : 0.2,
    top : 0.2,
    bottom : 0,
};
test('BaseD3View loads correctly on desktop', () => {

    let view = new base.BaseD3View(id, {
        aspectRatio,
        mobileAspectRatio,
        marginRatios,
    });
    expect(view.canvasWidth).toBe(693);
    expect(view.canvasHeight).toBe(554);
    expect(view.offsets.left).toBe(69.3);
    expect(view.offsets.right).toBe(693 - 69.3);
    expect(view.offsets.top).toBe(69.3);
    expect(view.offsets.bottom).toBe(554 - 69.3);

});

test('BaseD3View handles a desktop resize', () => {

    const spy = jest.spyOn(base.BaseD3View.prototype, 'resize');
    let view = new base.BaseD3View(id, {
        aspectRatio,
        mobileAspectRatio,
        marginRatios,
    });

    expect(spy).not.toHaveBeenCalled();

    // Test null resize
    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalled();
    expect(parseInt(view.svg.style.minHeight)).toBe(554);

    // Test an actual resize
    view.wrapper.offsetWidth = 400;
    window.dispatchEvent(new Event('resize'));
    expect(spy).toHaveBeenCalled();
    expect(parseInt(view.svg.style.minHeight)).toBe(320);

});

test('BaseD3View loads correctly on mobile', () => {

    window.resizeTo(320, 640);
    let view = new base.BaseD3View(id, {
        aspectRatio,
        mobileAspectRatio,
        marginRatios,
    });
    expect(view.canvasWidth).toBe(693);
    expect(view.canvasHeight).toBe(693);
    expect(view.offsets.left).toBe(69.3);
    expect(view.offsets.right).toBe(693 - 69.3);
    expect(view.offsets.top).toBe(69.3);
    expect(view.offsets.bottom).toBe(693 - 69.3);

});

test('BaseD3View loads correctly on mobile with rescaling enabled', () => {

    window.resizeTo(320, 640);
    let view = new base.BaseD3View(id, {
        aspectRatio,
        mobileAspectRatio,
        marginRatios,
        rescaleMarginsForMobile : true,
    });
    expect(view.canvasWidth).toBe(693);
    expect(view.canvasHeight).toBe(693);
    expect(view.offsets.left).toBe(69.3);
    expect(view.offsets.right).toBe(693 - 69.3);
    expect(view.offsets.top).toBe(69.3);
    expect(view.offsets.bottom).toBe(693 - 1.8*69.3);

});

test('BaseD3View loads correctly on mobile with custom margins', () => {

    window.resizeTo(320, 640);
    let view = new base.BaseD3View(id, {
        aspectRatio,
        mobileAspectRatio,
        marginRatios,
        mobileMarginRatios,
    });
    expect(view.canvasWidth).toBe(693);
    expect(view.canvasHeight).toBe(693);
    expect(view.offsets.left).toBe(2*69.3);
    expect(view.offsets.right).toBe(693 - 2*69.3);
    expect(view.offsets.top).toBe(2*69.3);
    expect(view.offsets.bottom).toBe(693);

});
