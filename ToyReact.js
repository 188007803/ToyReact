"use strict";



class ElementWrapper {
    constructor(type) {
        // this.root = document.createElement(type);
        this.type = type;
        this.props = Object.create(null);
        this.children = [];
    }
    setAttribute(name, value) {
        // if (name.match(/^on([\s\S]+)$/)){
        //     let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
        //     this.root.addEventListener(eventName, value)
        // }
        // else if (name === 'className') {
        //     name = 'class'
        // }
        // this.root.setAttribute(name, value)
        this.props[name] = value
    }
    appendChild(vchild) {
        this.children.push(vchild)
        // let range = document.createRange()
        // if (this.root.children.length) {
        //     range.setStartAfter(this.root.lastChild)
        //     range.setEndAfter(this.root.lastChild)
        // } else {
        //     range.setStart(this.root, 0,)
        //     range.setEnd(this.root, 0,)
        // }
        // vchild.mountTo(range)
    }
    mountTo(range) {
        this.range = range;
        range.deleteContents()
        // range.insertNode(this.root)
        let element = document.createElement(this.type)
        for (let name in this.props) {
            let value = this.props[name]
            if (name.match(/^on([\s\S]+)$/)){
                let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
                element.addEventListener(eventName, value)
            }
            else if (name === 'className') {
                name = 'class'
            }
            element.setAttribute(name, value)
        }

        for (let child of this.children) {
            let range = document.createRange()
            if (element.children.length) {
                range.setStartAfter(element.lastChild)
                range.setEndAfter(element.lastChild)
            } else {
                range.setStart(element, 0,)
                range.setEnd(element, 0,)
            }
            child.mountTo(range)
        }

        range.insertNode(element)
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
        this.type = '#type';
        this.children = [];
        this.props = Object.create(null);
    }
    mountTo(range) {
        this.range = range;
        range.deleteContents();
        range.insertNode(this.root)
    }
}
 
export class Component {

    constructor(){
        this.children = []
        this.props = Object.create(null)
    }

    get type(){
        return this.constructor.name
    }

    setAttribute(name, value){
        if (name.match(/^on([\s\S]+)$/)){
            console.log(RegExp.$1)
        }
        this.props[name] = value;
        this[name] = value;
    }

    mountTo(range){
        this.range = range
        this.update();
    }

    update(){
        // const placeholder = document.createComment('placeholder')
        // const range = document.createRange();
        // range.setStart(this.range.endContainer, this.range.endOffset);
        // range.setEnd(this.range.endContainer, this.range.endOffset);
        // range.insertNode(placeholder)

        // this.range.deleteContents()
        let vdom = this.render()
        if (this.vdom) {

            // 判断节点本身相同
            let isSameNode = (node1, node2) => {
                if (node1.type !== node2.type) {
                    return false;
                }
                for (let name in node1.props) {
                    if (node1.props[name] !== node2.props[name]) {
                        return false;
                    }
                }
                if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
                    return false;
                }
            }
            
            // 判断节点树（包括节点本身）是否相同
            let isSameTree = (node1, node2) => {
                if (!isSameNode(node1, node2)) {
                    return false;
                }
                if (node1.children.length !== node2.children.length) {
                    return false;
                }
                for (let i = 0; i < node1.children.length; i++) {
                    if (!isSameTree(node1.children[i], node2.children[i])) {
                        return false
                    }
                }
                return true;
            }

            let replace = (newTree, oldTree) => {
                if (isSameTree(newTree, this.oldTree)) {
                    return;
                }
                if (!isSameNode(newTree, oldTree)) {
                    vdom.mountTo(oldTree.range)
                } else {
                    for (let i = 0; i< newTree.children.length; i++) {
                        replace(newTree.children[i], oldTree.children[i]);
                    }
                }
            }
            
            replace(vdom, this.vdom)

        } else {
            vdom.mountTo(this.range)
        }
        this.vdom = vdom;

        // placeholder.parentNode.removeChild(placeholder)
    }

    appendChild(vchild) {
        this.children.push(vchild)
    }

    setState(state) {
        let merge = (oldState, newState) => {
            for (let key in newState) {
                if (typeof newState[key] === 'object' && newState[key !== null]) {
                    if (typeof oldState[key] !== 'object') {
                        if (Array.isArray(newState[key])) {
                            oldState[key] = [];
                        } else {
                            oldState[key] = {}
                        }
                    }
                    merge(oldState[key], newState[key])
                } else {
                    oldState[key] = newState[key]
                }
            }
        }
        if (!this.state && state) {
            this.state = {}
        }
        merge(this.state, state)
        this.update()
    }
}




export const ToyReact = {
    createElement(type, attributes, ...children) {
        let element;
        if (typeof type === 'string') {
            element = new ElementWrapper(type)
        } else {
            element = new type
        }

        for (const name in attributes) {
            element.setAttribute(name, attributes[name])
        }

        const insertChildren = (children) => {
            for (const child of children) {

                if (Array.isArray(child)) {
                    insertChildren(child)
                } else {
                    if (
                        !(child instanceof Component) &&
                        !(child instanceof ElementWrapper) &&
                        !(child instanceof TextWrapper)
                        ) {
                        child = String(child)
                    }
                    if (typeof child === 'string') {
                        child = new TextWrapper(child)
                    }
                    element.appendChild(child)
                }
            }
        }

        insertChildren(children) 

        return element
    },

    render(vdom, element) {
        let range = document.createRange()
        if (element.children.length) {
            range.setStartAfter(element.lastChild)
            range.setEndAfter(element.lastChild)
        } else {
            range.setStart(element, 0,)
            range.setEnd(element, 0,)
        }
        vdom.mountTo(range)
    }
}