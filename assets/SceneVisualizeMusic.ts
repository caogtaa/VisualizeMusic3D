// Copyright 2021 Cao Gaoting<caogtaa@gmail.com>
// https://caogtaa.github.io
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
/*
 * Date: 2021-05-18 23:31:23
 * LastEditors: GT<caogtaa@gmail.com>
 * LastEditTime: 2021-05-23 22:48:17
*/ 

import { _decorator, RenderTexture, SpriteFrame, Node, Camera, Texture2D, Component, AudioClip, Sprite, Material, UITransform, AudioSource, Color, director, Canvas, RenderPipeline, size, rect, math, v2, CameraComponent } from 'cc';
import { RTWriter } from './RTWriter';
const {ccclass, property} = _decorator;

class RenderBuff {
    texture: RenderTexture = null;
    spriteFrame: SpriteFrame | null = null;
    // canvas: Canvas | null = null;
    // cameraNode: Node | null = null;
    // camera: Camera | null = null;

    /**
     * 创建一个用于计算的RenderBuff（采样方式是邻近像素）
     * @param width 
     * @param height 
     * @returns 
     */
    public static CreateComputeBuff(camera: Camera, width: number, height: number): RenderBuff {
        let result = new RenderBuff;
        let texture = camera.getComponent(RTWriter).rt;
        // let texture = result.texture = new RenderTexture;
        // texture.packable = false;
        // texture.setFilters(Texture2D.Filter.NEAREST, Texture2D.Filter.NEAREST);
        // texture.initWithSize(width, height);

        // todo: set filter = NEAREST
        // texture.reset({
        //     width: width, 
        //     height: height
        // });

        result.spriteFrame = new SpriteFrame;
        result.spriteFrame.reset({
            originalSize: size(width, height),
            rect: rect(0, 0, width, height),
            offset: v2(0, 0),
            isRotate: false,
            texture: texture,
        });

        result.spriteFrame.packable = false;
        return result;
    }
    /**
     * 清空纹理内容
     */
    public Clear() {
        // let texture = this.texture;
        // //@ts-ignore
        // let opts = texture._getOpts();
        // let size = texture.width * texture.height;
        // opts.image = new Uint8Array(size * 4);
        // texture.update(opts);
    }
}

@ccclass('SceneVisualizeMusic')
export default class SceneVisualizeMusic extends Component {
    @property([AudioClip])
    clips: AudioClip[] = [];

    @property([SpriteFrame])
    fftTextures: SpriteFrame[] = [];

    @property(Node)
    visualizer: Node | null = null;

    @property(Node)
    visualizerH5: Node | null = null;

    @property(Sprite)
    visualizerEx: Sprite | null = null;

    @property([Sprite])
    pass0Imgs: Sprite[] = [];

    @property([Material])
    materials: Material[] = [];

    @property([Material])
    pass0Materials: Material[] = [];

    // todo: protect it
    @property(AudioSource)
    audioSource: AudioSource | null = null;

    protected _audioIndex: number = -1;
    protected _matIndex: number = -1;
    protected _renderBuffMap = new Map<Node, RenderBuff>();
    // 保存名字对应的材质，简单起见在onLoad里hardcode
    protected _nameToMat = new Map<string, Material>();
    protected _nameToPass0Mat = new Map<string, Material>();
    // 多pass渲染时，材质依赖关系。
    // pass 0需要计算image buff，保存时序相关信息，这里暂时不使用Cocos自带的多pass，先用多个组件按顺序render的方式
    protected _matDep = new Map<string, string>();

    protected EffectName(mat: Material): string {
        let tokens = mat.effectName.split('/');
        return tokens[tokens.length-1];
    }

    onLoad() {
        this.audioSource = this.getComponent(AudioSource);

        for (let m of this.materials) {
            this._nameToMat.set(m.name, m);
        }

        for (let m of this.pass0Materials) {
            this._nameToPass0Mat.set(this.EffectName(m), m);
        }

        this._matDep
            .set("vm-meter", "vm-frame-picker")
            .set("vm-circle", "vm-frame-picker")

        // this._matDep
        //     .set("VMWaveFFT", "VMPolarExPass0")
        //     .set("VMPolarWave", "VMPolarExPass0")
        //     .set("VMPolarEx", "VMPolarExPass0")
        //     .set("VMPolar", "VMClassicFFTExPass0")
        //     .set("VMMeter", "VMClassicFFTExPass0")
        //     .set("VMClassic", "VMClassicFFTExPass0")
        //     .set("VMCircle", "VMClassicFFTExPass0")

        this.NextAudio();
        this.NextMat();
    }
    
    public NextMat() {
        if (this.materials.length === 0)
            return;

        let index = this._matIndex = (this._matIndex + 1) % this.materials.length;
        let mat = this.materials[index];
        
        let matDep = this._nameToPass0Mat.get(this._matDep.get(this.EffectName(mat)));
        for (let img of this.pass0Imgs) {
            // todo:
            // img.customMaterial = matDep;
            img.spriteFrame = this.fftTextures[this._audioIndex];

            let renderBuff = this._renderBuffMap.get(img.node);
            if (!renderBuff) {
                let size = img.getComponent(UITransform)?.contentSize;
                renderBuff = RenderBuff.CreateComputeBuff(img.node.parent.getComponent(Camera), size!.width, size!.height);
                this._renderBuffMap.set(img.node, renderBuff);
            } else {
                // 清空buff避免受上一个效果影响
                renderBuff.Clear();
            }

            // assign renderBuff to materials texture 2
            // todo: break loop
            // img.customMaterial.setProperty("tex2", renderBuff.texture);
        }

        // todo:
        // this.visualizerEx.customMaterial = mat;
    }
    
    public NextAudio() {
        if (this.clips.length === 0 || this.fftTextures.length !== this.clips.length)
            return;

        let index = this._audioIndex = (this._audioIndex + 1) % this.clips.length;
        // let audioId = this._audioId = cc.audioEngine.playMusic(this.clips[index], true);
        let audioSource = this.audioSource!;
        audioSource.stop();
        audioSource.clip = this.clips[index];
        audioSource.loop = true;
        audioSource.play();

        //@ts-ignore
        // this.visualizer?.getComponent("MusicVisualizer")?.SyncAudio(audioSource, this.fftTextures[index]);

        // 实时FFT分析的方法只有H5环境可以工作
        // this.visualizerH5?.getComponent("MusicVisualizerH5")?.SyncAudio(audioId);

        // todo: do not re-create buff? clear with empty data
        for (let img of this.pass0Imgs) {
            img.spriteFrame = this.fftTextures[index];

            // let size = img.getComponent(UITransform)!.contentSize;
            // let renderBuff = RenderBuff.CreateComputeBuff(size!.width, size!.height);
            // this._renderBuffMap.set(img.node, renderBuff);

            // // assign renderBuff to materials texture 2
            // img.customMaterial.setProperty("tex2", renderBuff.texture);
        }
    }

    protected UpdateFFTShader(sprite: Sprite, frame: number) {
        let textureHeight = sprite?.spriteFrame?.texture?.height || 1;
        let samplePerRow = 16;//this._samplePerRow;

        // +0.5确保不会采样到其他row
        let row = (Math.floor(frame / samplePerRow) + 0.5) / textureHeight;
        let startCol = (frame % samplePerRow) / samplePerRow;
        let endCol = (frame % samplePerRow + 1) / samplePerRow;
        let mat = sprite.customMaterial;
        if (mat) {
            mat.setProperty("row", row);
            mat.setProperty("startCol", startCol);
            mat.setProperty("endCol", endCol);
        }
    }
    
    protected _audioId: number = -1;
    protected _srcIndex: number = 0;
    protected Tick() {
        // if (this._audioId === -1)
        if (!this.audioSource?.playing)
            return;

        // let t = cc.audioEngine.getCurrentTime(this._audioId);
        let t = this.audioSource!.currentTime;
        let frame = Math.floor(t * 60);     // floor or round?

        let pass0Imgs = this.pass0Imgs;
        let order = this._srcIndex;
        let from = pass0Imgs[order];
        let to = pass0Imgs[1-order];

        // 由于3.x的RT渲染需要推迟一帧，这里需要在滚动RT前展示上一帧的结果
        // todo: 这么搞会被推迟2帧，看来必须用multi pass shader了
        this.visualizerEx.spriteFrame = this._renderBuffMap.get(from.node).spriteFrame;

        this.UpdateFFTShader(from, frame);
        let toCamera = to.node.parent.getComponent(CameraComponent);
        toCamera.targetTexture = null;        // 解绑上一帧的from节点的texture
        toCamera.enabled = false;

        let fromCamera = from.node.parent.getComponent(CameraComponent);
        fromCamera.enabled = true;

        // fromCanvas.enabled = true;
        this.RenderToNode(from.node, to.node);
        // fromCanvas.enabled = false;       // 渲染结束后隐藏自己

        // 切换RenderTexture
        this._srcIndex = 1 - this._srcIndex;
    }

    onDestroy() {
        this.audioSource?.stop();
        //cc.audioEngine.stopMusic();
    }

    update() {
        this.Tick();
    }

    /**
     * 1:1将root内容渲染到target
     * @param root 
     * @param target 
     * @returns 
     */
    public RenderToNode(root: Node, target: Node): RenderTexture | null {
        let targetBuff = this._renderBuffMap.get(target);
        let rootBuff = this._renderBuffMap.get(root);
        if (!targetBuff || !rootBuff)
            return null;       

        // if (!renderBuff.cameraNode || !renderBuff.camera) {
        // if (!rootBuff.canvas) {
        //     // 创建截图专用的camera
        //     // 使截屏处于被截屏对象中心（两者有同样的父节点）
        //     let canvas = rootBuff.canvas = root.parent.getComponent(Canvas);
        //     let rootTransform = root.getComponent(UITransform)!;

        //     // let camera = renderBuff.camera = cameraNode.getComponent(Camera);
        //     // camera.backgroundColor = new Color(255, 255, 255, 0);        // 透明区域仍然保持透明，半透明区域和白色混合
        //     // camera.clearFlags = cc.Camera.ClearFlags.DEPTH | cc.Camera.ClearFlags.STENCIL | cc.Camera.ClearFlags.COLOR;

        //     // 设置你想要的截图内容的 cullingMask
        //     // camera.cullingMask = 0xffffffff;

        //     // let targetWidth = root.width;
        //     let targetHeight = rootTransform.height;

        //     // camera.alignWithScreen = false;
        //     // camera.orthoSize = targetHeight / 2;
        // }

        let camera = root.parent.getComponent(CameraComponent);
        camera.targetTexture = targetBuff.texture;

        //let cameraComponent = rootBuff.canvas.cameraComponent;
        //cameraComponent.targetTexture = targetBuff.texture;
        // director.root.pipeline.render([cameraComponent.camera]);
        // cameraComponent.targetTexture = null;


        return targetBuff.texture;
    }
}
