
const childrenSymbol = Symbol('children');

class ElementWrapper {
    constructor(type) {
        this.type = type;
        this.props = Object.create(null);
        this[childrenSymbol] = [];
        this.children = [];
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(vchild) {
        this[childrenSymbol].push(vchild);
        this.children.push(vchild.vdom);
    }
    get vdom() {
        return this;
    }
    mountTo(range) {
        this.range = range;

        // 创建占位节点，守住位置
        const placeholder = document.createElement('placeholder');
        const endRange = document.createRange();
        endRange.setStart(range.endContainer, range.endOffset)
        endRange.setEnd(range.endContainer, range.endOffset)
        endRange.insertNode(placeholder)

        // 清空挂载范围
        range.deleteContents();

        // 创建实dom
        const element = document.createElement(this.type)

        // 完善实dom本身，包括属性，事件
        for (let name in this.props) {
            let value = this.props[name]
            if (name.match(/^on([\s\S]+)$/)) {
                let eventName = RegExp.$1.replace(/^[\s\S]/, s => s.toLowerCase());
                element.addEventListener(eventName, value)
            }
            else if (name === 'className') {
                element.setAttribute('class', value)
            }
            else {
                element.setAttribute(name, value)
            }
        }

        // 完善实dom树
        for (const child of this.children) {
            let range = document.createRange();
            if (element.children.length) {
                range.setStartAfter(element.lastChild)
                range.setEndAfter(element.lastChild);
            } else {
                range.setStart(element, 0)
                range.setEnd(element, 0)
            }
            child.mountTo(range)
        }

        // 挂载实dom
        range.insertNode(element);
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
        this.type = '#text';
        this.children = [];
        this.props = Object.create(null);
    }
    mountTo(range) {
        this.range = range;
        range.deleteContents();
        range.insertNode(this.root);
    }
    get vdom(){
        return this;
    }
}

export class Component {
    constructor(){
        this.children = [];
        this.props = Object.create(null);
    }
    mountTo(range) {
        this.range = range;
        this.update();
    }

    // 更新逻辑
    update(){
        const vdom = this.vdom;
        if (this.oldVdom) {

            // 比较节点
            const isSameNode = (node1, node2) => {
                if (node1.type !== node2.type) return false;

                if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
                    return false;
                }

                for (const name in node1.props) {
                    if (typeof node1.props[name] == 'object' && typeof node2.props[name] == 'object') {
                        if (JSON.stringify(node1.props[name]) == JSON.stringify(node2.props[name])) {
                            continue;
                        }
                    }
                    if (node1.props[name] !== node2.props[name]) return false;
                }

                return true;
            }

            // 比较树
            const isSameTree = (node1, node2) => {
                if (!isSameNode(node1, node2)) return false;
                if (node1.children.length !== node2.children.length) return false;
                for (let i = 0; i < node1.children.length; i++) {
                    if (!isSameTree(node1.children[i], node2.children[i])) return false;
                }
                return true;
            }

            // 替换新旧节点
            const replace = (newTree, oldTree) => {
                if (isSameTree(node1, node2)) {
                    return;
                }
                if (!isSameNode(newTree, oldTree)) {
                    newTree.mountTo(oldTree.range);
                } else {
                    for (let i = 0; i < newTree.children.length; i++) {
                        replace(newTree.children[i], oldTree.children[i])
                    }
                }
            }

            replace(vdom, this.oldVdom, '')

        } else {
            vdom.mountTo(this.range)
        }
        this.oldVdom = vdom
    }


    get vdom(){
        return this.render().vdom;
    }
    appendChild(vchild) {
        this.children.push(vchild);
    }
    setState(state) {
        const merge = (oldState, newState) => {
            for (let p in newState) {
                if (typeof newState[p] === 'object' && newState[p] !== null) {
                    if (typeof oldState[p] !== 'object') {
                        if (newState[p] instanceof Array) {
                            oldState[p] = []
                        } else {
                            oldState[p] = {}
                        }
                    }
                    merge(oldState[p], newState[p])
                } else {
                    oldState[p] = newState[p]
                }
            }
        }
        if (!this.state && state) {
            this.state = {}
        }
        merge(this.state, state);
        this.update();
    }
}


export const ToyReact = {
    createElement (type, attributes, ...children) {
        let element;

        // 创建vdom
        if (typeof type === 'string') {
            element = new ElementWrapper(type)
        } else {
            element = new type;
        }

        // vdom 赋属性
        for (const name in attributes) {
            element.setAttribute(name, attributes[name])
        }

        // vdom 载入子节点
        const insertChild = (children) => {
            for (let child of children) {
                if (typeof child === 'object' && child instanceof Array) {
                    insertChild(child)
                } else {
                    if (child === null || child === void 0) {
                        child = '';
                    }
                    else if (
                           !(child instanceof Component)
                        && !(child instanceof ElementWrapper)
                        && !(child instanceof TextWrapper)
                    ){
                        child = String(child);
                    }
                    if (typeof child === 'string') {
                        child = new TextWrapper(child)
                    }
                    element.appendChild(child);
                }
            }
        }

        insertChild(children)
        return element;
    },

    render (vdom, element) {
        const range = document.createRange();
        if (element.children.length) {
            range.setStartAfter(element.lastChild)
            range.setEndAfter(element.lastChild)
        } else {
            range.setStart(0)
            range.setEnd(0)
        }
        vdom.mountTo(range)
    }
}