let childrenSymbol = Symbol("children");

// "if" keyword is ugly. Use wrapper instead.
class ElementWrapper {
    constructor(type) {
        this.type = type;
        this.props = Object.create(null);
        this[childrenSymbol] = [];
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
        this[childrenSymbol].push(vchild);
        this.children.push(vchild.vdom);
    }

    get vdom() {
        return this;
    }

    mountTo(range) {
        this.range = range; // save the range
        
        let placeholder = document.createComment("placeholder");
        let endRange = document.createRange();
        endRange.setStart(range.endContainer, range.endOffset);
        endRange.setEnd(range.endContainer, range.endOffset);
        endRange.insertNode(placeholder);

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
        this.type = "#text";
        this.children = [];
        this.props = Object.create(null);
    }

    mountTo(range) {
        this.range = range; // save the range
        range.deleteContents();
        range.insertNode(this.root);
    }

    get vdom() {
        return this;
    }
}

export class Component {
    constructor() {
        this.children = [];
        this.props = Object.create(null);  // null => Get rid of default methods in Object(e.g toSting)
    }

    // Type getter
    get type() {
        return this.constructor.name;
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

        let vdom = this.vdom;
        if (this.oldVdom) {
            // check if two V-DOM nodes are same 
            let isSameNode = (node1, node2) => {

                if (node1.type !== node2.type) {
                    // if node types are not same
                    return false;
                }
                if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
                    // if lengths of props are not same
                    return false;
                }
                for (let name in node1.props) {
                    // Causing unexpected "all same", without central eventbus built in react
                    // Now the re-render region is larger than expected(single block) bc/ event change e.g. 'onClick'
                    //
                    // if (typeof node1.props[name] === 'function' && typeof node2.props[name] === 'function' && 
                    //     node1.props[name].toString() === node2.props[name].toString()) {
                    //     continue;
                    // }
                    if (typeof node1.props[name] === 'object' && typeof node2.props[name] === 'object' && 
                        JSON.stringify(node1.props[name])=== JSON.stringify(node2.props[name])) {
                        continue;
                    }
                    if (node1.props[name] !== node2.props[name]) {
                        // if any prop is not same
                        return false;
                    }
                }
                return true;
            }

            // check if two whole V-DOM trees are same. Recursively check on subtrees
            let isSameTree = (node1, node2) => {
                if (!isSameNode(node1, node2)) {
                    // if root nodes are are not same
                    return false;
                }
                if (node1.children.length !== node2.children.length) {
                    // if lengths of children nodes are not same
                    return false;
                }
                for (let i = 0; i < node1.children.length; i++) {
                    // if any corresponding childs are not same trees
                    if (!isSameTree(node1.children[i], node2.children[i])) {
                        return false;
                    }
                }
                return true;
            }

            let replace = (newTree, oldTree, indent) => {
                console.log(indent + "New:", newTree);
                console.log(indent + "Old:", oldTree);
                // debugger;
                if (isSameTree(newTree, oldTree)) {
                    // old and new V-DOM trees are identical
                    console.log("all same");
                    return;
                }
                // if two trees has something different
                if (!isSameNode(newTree, oldTree)) {
                    // if root nodes are different, replace the whole tree
                    console.log("all different");
                    newTree.mountTo(oldTree.range);
                } else {
                    // attempt to update the subtree
                    for (let i = 0; i < newTree.children.length; i++) {
                        // Recursive call;
                        replace(newTree.children[i], oldTree.children[i], " " + indent)
                    }
                }
            }

            replace(vdom, this.oldVdom, "");

        } else {
            vdom.mountTo(this.range);
        }
        this.oldVdom = vdom;   // save V-DOM

        // ... didUpdate(omitted)
    }

    get vdom() {
        return this.render().vdom;
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