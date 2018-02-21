// import '../sass/index.scss';
// import { ExampleView } from './lib/app';

// document.addEventListener("DOMContentLoaded", function(event) {
//     new ExampleView();
// });

function greeter(person: string) {
    return "Hello, " + person;
}

let user = "Chris User";

document.body.innerHTML = greeter(user);