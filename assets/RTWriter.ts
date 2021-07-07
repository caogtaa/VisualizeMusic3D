// Copyright 2021 Cao Gaoting<caogtaa@gmail.com>
// https://caogtaa.github.io
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*
 * Date: 2021-07-07 11:44:31
 * LastEditors: GT<caogtaa@gmail.com>
 * LastEditTime: 2021-07-07 11:44:53
*/ 

import { _decorator, Component, Node, RenderTexture, Camera } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RTWriter')
export class RTWriter extends Component {
    // [1]
    // dummy = '';

    // [2]
    // @property
    // serializableDummy = 0;

    @property(RenderTexture)
    rt: RenderTexture = null;

    protected _camera: Camera = null;

    onLoad() {
        this._camera = this.getComponent(Camera);
    }

    start () {
        // [3]
    }

    // update (deltaTime: number) {
    //     // [4]
    // }
}
