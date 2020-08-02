import {ToyReact} from './ToyReact';

let a = <div name="a" id="ida">
        <span>Hello</span>
        <span>World</span>
        <span>!</span>
    </div>


ToyReact.render(
  a,
  document.body
);