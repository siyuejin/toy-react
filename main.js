// import {ToyReact} from './ToyReact';

let a = <div name="a" id="ida">
        <span>Hello</span>
        <span>World</span>
        <span>!</span>
    </div>

document.body.appendChild(a)

/*
Interpreted as the following code:

var a = ToyReact.createElement("div", {
    name: "a",
    id: "ida"
  }, 
  ToyReact.createElement("span", null, "Hello"), 
  ToyReact.createElement("span", null, "World"), 
  ToyReact.createElement("span", null, "!")
);
document.body.appendChild(a);

*/
  