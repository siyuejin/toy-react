// "if" keyword is ugly. Use wrapper instead.
class ElementWrapper {
    constructor(type) {
        this.type = type;
        this.props = Object.create(null);
        this.children = [];
    }

    setAttribute(name, value) {
        // match all strings begining with 'on', and catch the substring following.
        // if (name.match(/^on([\s\S]+)$/)) {
        //     let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
        //     this.root.addEventListener(eventName, value);
        // }
        // if (name === "className") {
        //     this.root.setAttribute("class", value);
        // }
        // this.root.setAttribute(name, value);

        this.props[name] = value;
    }

    appendChild(vchild) {
        // let range = document.createRange();
        // if (this.root.children.length) {
        //     range.setStartAfter(this.root.lastChild);
        //     range.setEndAfter(this.root.lastChild);
        // } else {
        //     range.setStart(this.root, 0);
        //     range.setEnd(this.root, 0);
        // }
        // vchild.mountTo(range);
        this.children.push(vchild);
    }

    mountTo(range) {
        range.deleteContents();
        let element = document.createElement(this.type);

        // setAttribute
        for (let name in this.props) {
            let value = this.props[name];
            if (name.match(/^on([\s\S]+)$/)) {
                let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
                element.addEventListener(eventName, value);
            }
            if (name === "className") {
                element.setAttribute("class", value);
            }
            element.setAttribute(name, value)
        }

        // mountTo
        for (let child of this.children) {
            let range = document.createRange();
            if (element.children.length) {
                range.setStartAfter(element.lastChild);
                range.setEndAfter(element.lastChild);
            } else {
                range.setStart(element, 0);
                range.setEnd(element, 0);
            }
            child.mountTo(range);
        }

        range.insertNode(element);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    mountTo(range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component {
    constructor() {
        this.children = [];
        this.props = Object.create(null);  // null => Get rid of default methods in Object(e.g toSting)
    }

    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            // console.log(RegExp.$1); do nothing for now
        }
        this.props[name] = value; 
        this[name] = value;
    }

    mountTo(range) {
        // ... willMount(omitted)

        this.range = range // save the range, for later update
        this.update();

        // ... didMount(omitted)
    }

    update() {
        // ... willUpdate(omitted)

        let vdom = this.render();
        if (this.vdom) {
            console.log("new:", vdom);
            console.log("old:", this.vdom);
        } else {
            vdom.mountTo(this.range);
        }
        this.vdom = vdom;   // save V-DOM

        // ... didUpdate(omitted)
    }

    appendChild(vchild) {
        this.children.push(vchild);
    }

    setState(state) {
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (typeof newState[p] === 'object' && newState[p] !== null) {
                    if (typeof oldState[p] !== 'object') {
                        if (newState[p] instanceof Array) {
                            oldState[p] = [];
                        } else {
                            oldState[p] = {};
                        }
                    }
                    merge(oldState[p], newState[p]);
                } else {
                    oldState[p] = newState[p];
                }
            }
        }
        if (!this.state && state) {
            this.state = {};
        }
        merge(this.state, state);
        this.update();
    }
}


export let ToyReact = {
    createElement(type, attributes, ...children) {
        let element;
        if (typeof type === "string") {
            element = new ElementWrapper(type);
        } else {
            element = new type;
        }
        for (let name in attributes) {
            // element[name] = attributes[name] wrong
            element.setAttribute(name, attributes[name]);
        }
        let insertChildren = (children) => {
            for (let child of children) {
                if (typeof child === "object" && child instanceof Array) {
                    insertChildren(child);   // Recursive insertion to expand the children array
                } else {
                    // Safety: for unknown type, coerce to string
                    // eg. boolean true -> string "true"
                    if (child === null || child === void 0) {   // void 0 => undefined
                        child = "";
                    }
                    if (!(child instanceof Component) 
                    && !(child instanceof ElementWrapper)
                    && !(child instanceof TextWrapper)) {
                        child = String(child);
                    }
                    if (typeof child === "string") {
                        child = new TextWrapper(child);
                    }
                    element.appendChild(child);
                }
            }
        }
        insertChildren(children);
        return element;
    },

    render(vdom, element) {
        let range = document.createRange();
        if (element.children.length) {
            range.setStartAfter(element.lastChild);
            range.setEndAfter(element.lastChild);
        } else {
            range.setStart(element, 0);
            range.setEnd(element, 0);
        }
        vdom.mountTo(range);
    }
}