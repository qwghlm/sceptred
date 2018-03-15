import { h, render } from 'preact';
import { App } from '../../components/app';

jest.mock("../../components/map", () => {
	return { Map : () => "" }
});

test('App component renders', () => {

	let mount = document.createElement('div');
	let app = render(<App/>, mount);
	document.body.appendChild(mount);

	expect(document.querySelector('input').value).toEqual("");

	// Expect button to be disabled
	// Expect button not to have loading state

	// Enter text and trigger a change

	// Expect button to be enabled
	// Expect button not to have loading state

	// Click the button

	// Expect button to have loading state

});
