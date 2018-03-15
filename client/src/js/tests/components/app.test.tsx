import { h, render } from 'preact';
import { App } from '../../components/app';

jest.mock("../../components/map", () => {
	return { Map : jest.fn(() => "") }
});

function fireEvent(target, eventType) {
	var evt = document.createEvent("Event");
	    evt.initEvent(eventType, false, true);
	    target.dispatchEvent(evt);
}

test('App component renders', async () => {

	let mount = document.createElement('div');
	let app = render(<App/>, mount);
	document.body.appendChild(mount);

	let input = document.querySelector('input');
	let button = document.querySelector('button');

	// Initial state: empty input, disabled button
	expect(input.value).toEqual("");
	expect(button.disabled).toBe(true);
	expect(button.className).not.toMatch(/loading/);

	// Enter some text, expect button to become enabled
	input.value = "NT27";
	await fireEvent(input, "change");
	expect(button.disabled).toBe(false);
	expect(button.className).not.toMatch(/loading/);

	// Click the button, expect state to be loading
	await fireEvent(button, "click");
	expect(button.disabled).toBe(false);
	// expect(button.className).toMatch(/loading/); TODO

	// TODO Check that <Map/> props have been updated

});
