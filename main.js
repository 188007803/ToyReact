"use strict"

import {ToyReact, Component} from './ToyReact'

class MyComponent extends Component{
    render(){
        return (
            <div>
                <span>hello</span>
                <span>world</span>
                123
                {true}
                {this.children}
            </div>
        )
    }
}

let a = <MyComponent name="a" id="a"></MyComponent>


ToyReact.render(a, document.body)