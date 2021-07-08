// Copyright 2021 Cao Gaoting<caogtaa@gmail.com>
// https://caogtaa.github.io
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

/*
 * Date: 2021-07-07 22:01:19
 * LastEditors: GT<caogtaa@gmail.com>
 * LastEditTime: 2021-07-07 22:03:56
*/ 

import { _decorator, Component, Node, AudioSource, SpriteFrame, AudioClip, instantiate, UITransform, Texture2D, director, gfx, TiledUserNodeData, RenderTexture, Slider, Camera, Sprite, size, v2, rect } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SceneVisualizeMusic3D')
export default class SceneVisualizeMusic3D extends Component {
    // [1]
    // dummy = '';
    protected _audioSource: AudioSource = null;
    protected _audioIndex: number = -1;
    protected _arrayBuffer: ArrayBuffer = null;
    protected _fft: Uint8Array = null;

    // [2]
    // @property
    // serializableDummy = 0;

    @property([AudioClip])
    clips: AudioClip[] = [];

    @property([SpriteFrame])
    fftTextures: SpriteFrame[] = [];

    @property(Camera)
    targetCamera: Camera = null;

    // 需要被渲染到RT的sprite
    @property(Sprite)
    srcContent: Sprite = null;

    // 展示RT的sprite
    @property(Sprite)
    content: Sprite = null;

    @property(RenderTexture)
    targetRT: RenderTexture = null;

    // @property(RenderTexture)
    // dummyRT: RenderTexture = null;

    onLoad() {
        this._audioSource = this.addComponent(AudioSource);
        let first = this.node.children[0];
        for (let i = 1; i < 16; ++i) {
            let pillar = instantiate(first);
            pillar.parent = this.node;
            pillar.position.set(-4 + i * 0.5, 0.501, 0);

            // let pos = pillar.position;
            // pos.set(-4 + i * 0.25);
            // pillar.position = pos;
        }

        this.NextAudio();
    }

    protected ReadTexture(sf: SpriteFrame): ArrayBuffer {
        let texture = sf.texture as RenderTexture;
        if (!texture)
            return null;

        let arrayBuffer = new ArrayBuffer(texture.width * texture.height * 4);      // color depth is 1byte, need * 4 here?
        let region = new gfx.BufferTextureCopy;
        region.texOffset.x = 0;
        region.texOffset.y = 0;
        region.texExtent.width = texture.width;
        region.texExtent.height = texture.height;

        // todo: 如何让Texture2D转换成RT？或者如何直接读取Texture2D的内容？
        director.root.device.copyFramebufferToBuffer(texture.window?.framebuffer!, arrayBuffer, [region]);

        // let frameBuffer = texture.getGFXTexture()._device.createFramebuffer();
        // director.root.device.copyFramebufferToBuffer(framebuffer, arrayBuffer, [region]);
        return arrayBuffer;
    }

    public OnSliderChanged(e: Slider) {
        let progress = e.progress * 2.;
        let rc = this.targetCamera.rect;
        if (e.name.startsWith("SliderW")) {
            rc.width = progress;
        } else {
            rc.height = progress;
        }

        this.targetCamera.rect = rc;
    }

    public NextAudio() {
        if (this.clips.length === 0 || this.fftTextures.length !== this.clips.length)
            return;

        let index = this._audioIndex = (this._audioIndex + 1) % this.clips.length;
        this.RenderToRT(this.fftTextures[index], this.srcContent, this.content);

        // read data from RT next frame
        let that = this;
        this.scheduleOnce(() => {
            that._arrayBuffer = that.ReadTexture(that.content.spriteFrame);
            that._fft = new Uint8Array(that._arrayBuffer);
            // todo: disable camera after that
        }, 0.);        

        let audioSource = this._audioSource!;
        audioSource.stop();
        audioSource.clip = this.clips[index];
        audioSource.loop = true;
        audioSource.play();
    }

    start() {

    }

    /**
     * 将srcImg赋值给src，渲染到dst的RenderTexture上
     * @param srcImg 
     * @param src 
     * @param dst 
     */
    protected RenderToRT(srcImg: SpriteFrame, src: Sprite, dst: Sprite) {
        let imgSize = srcImg.originalSize;
        src.getComponent(UITransform).contentSize = imgSize;
        dst.getComponent(UITransform).contentSize = imgSize;

        this.targetRT.reset({
            width: imgSize.width, 
            height: imgSize.height
        });
        this.targetCamera.orthoHeight = imgSize.height / 2;
        this.targetCamera.targetTexture = this.targetRT;
        let sp = new SpriteFrame;
        sp.reset({
            originalSize: imgSize,
            rect: rect(0, 0, imgSize.width, imgSize.height),
            offset: v2(0, 0),
            isRotate: false
        });

        sp.packable = false;
        sp.texture = this.targetRT;

        src.spriteFrame = srcImg;
        dst.spriteFrame = sp;

        // overwrite RT sampler
        let sampler = srcImg.texture.getGFXSampler();
        this.targetRT.getGFXSampler = () => {
            return sampler;
        };
    }

    protected Tick() {
        if (!this._audioSource?.playing)
            return;

        if (!this._fft)
            return;

        let t = this._audioSource!.currentTime;
        let frame = Math.floor(t * 60);

        let textureWidth = this.targetRT.width;
        let textureHeight = this.targetRT.height;
        let samplePerRow = 16;
        let sampleLength = textureWidth / samplePerRow;
        
        // RT Y上下颠倒
        let row = textureHeight - Math.floor(frame / samplePerRow);
        let startCol = (frame % samplePerRow) * sampleLength;
        let endCol = (frame % samplePerRow + 1) * sampleLength;

        let fft = this._fft;
        let children = this.node.children;
        for (let i = 0; i < children.length; ++i) {
            let c = startCol + i * 2;       // 16个柱子，但是sampleLength = 32
            let v = fft[(row * textureWidth + c) * 4];
            let pillar = children[i];
            let pos = pillar.position;
            let h = v / 255 * 5;        // map height to [0, 5]
            pillar.setScale(0.25, h, 0.25);
            pillar.setPosition(pos.x, h/2+0.01, pos.z);
        }
    }

    update (deltaTime: number) {
        this.Tick();
    }
}
