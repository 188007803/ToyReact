"use strict"

import ToyReact, { Component } from './ToyReact';

class MyComponent extends Component {
    return () {
        return (
            <div>
                <span>Hello</span>
                <span>World</span>
                <span>!</span>
                <div>
                    {false}
                    {this.children}
                </div>
            </div>
        )
    }
}

const a = (
    <MyComponent name="a" id="ida">
        <div>123</div>
    </MyComponent>
)

ToyReact.render(a, document.body);