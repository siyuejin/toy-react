import {ToyReact, Component} from './ToyReact';
class MyComponent extends Component {
    render() {
        return <div><span>hello</span><span>world!</span></div>
    }
}

let a = <MyComponent name="a" id="ida"></MyComponent>


ToyReact.render(
    a,
    document.body
);