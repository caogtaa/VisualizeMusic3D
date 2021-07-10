"use strict";
var __importStar = this && this.__importStar || function(e) {
    if (e && e.__esModule)
        return e;
    var n = {};
    if (null != e)
        for (var t in e)
            Object.hasOwnProperty.call(e, t) && (n[t] = e[t]);
    return n.default = e,
    n
};

Object.defineProperty(exports, "__esModule", {
    value: !0
});

var electron_1 = require("electron")
  , Pkg = __importStar(require("./package.json"))
  , Fs = require("fs")
  , Path = require("path");

// var CFG_PATH = Path.join(__dirname, "./.menu-config.json");
// fs_1.existsSync(CFG_PATH) || fs_1.writeFileSync(CFG_PATH, JSON.stringify({
//     assets: [],
//     hierarchy: []
// }));
var _buildFromTemplate = electron_1.Menu.buildFromTemplate;
function load() {
    electron_1.Menu.buildFromTemplate = function() {
        return hookFunc.apply(void 0, arguments),
        _buildFromTemplate.apply(void 0, arguments)
    }
}
function unload() {
    electron_1.Menu.buildFromTemplate = _buildFromTemplate
}
// function hookFunc(e) {
//     var n = require(CFG_PATH);
//     for (var t in n) {
//         var r = n[t];
//         switch (t) {
//         case "assets":
//             assetsMenu(e, r);
//             break;
//         case "hierarchy":
//             hierarchyMenu(e, r)
//         }
//     }
// }

function hookFunc(e) {
    let customMenu = [{
        label: "提取FFT纹理",
        // path: "F:\\workspace\\VisualizeMusic3D\\extensions\\music-visualizer\\what.js"
        click: () => {
            doExtractFFT();
        }
    }];

    assetsMenu(e, customMenu);
}

function assetsMenu(menu, ext) {
    // console.log(menu);
    // console.log(ext);
    // console.log('[LAB] ' + menu[0].label);
    // if (menu[0].submenu && menu[0].submenu.length > 0)
    //     console.log('[LAB-0] ' + e[0].submenu[0].label);

    if (menu.length === 0)
        return;

    if (menu[0].label !== Editor.I18n.t(Pkg.name + ".createFile"))
        return;

    if (!menu[0].submenu || menu[0].submenu.length === 0)
        return;

    let submenu = menu[0].submenu;
    if (submenu[0].label !== Editor.I18n.t(Pkg.name + ".createDir") &&
        submenu[0].label !== "Folder")      // 3.2.0菜单没有完全国际化，hard code fix
        return;
    
    extendCustomMenu(menu, ext);
}

// function hierarchyMenu(e, n) {
//     0 !== e.length && e[0].label === Editor.I18n.t(Pkg.name + ".createNode") && e[0].submenu && 0 !== e[0].submenu.length && e[0].submenu[0].label === Editor.I18n.t(Pkg.name + ".createEmptyNode") && extendMenu(e, n)
// }

// function extendMenu(e, n) {
//     // console.log('enter extendMenu');
//     n.forEach((function(n) {
//         var t = n.label.split("/")
//           , r = e.findIndex((function(e) {
//             return e && e.label === t[0]
//         }
//         ));
//         -1 === r && (e.push({
//             label: t[0]
//         }),
//         r = e.length - 1);
//         var u = e[r];
//         t.forEach((function(e, r) {
//             0 !== r && (u.submenu || (u.submenu = []),
//             u.submenu.push({
//                 label: e
//             }),
//             u = u.submenu[u.submenu.length - 1]),
//             r === t.length - 1 && fs_1.existsSync(n.path) && (u.click = require(n.path))
//         }
//         ))
//     }
//     ))
// }

function extendCustomMenu(e, n) {
    // console.log('enter extendMenu');
    n.forEach((function(n) {
        // split label name into tokens
        var t = n.label.split("/")
          , r = e.findIndex((function(e) {
            return e && e.label === t[0]
        }
        ));

        // create menu item if not present
        -1 === r && (e.push({
            label: t[0]
        }),
        r = e.length - 1);

        var u = e[r];
        t.forEach((function(e, r) {
            0 !== r && (u.submenu || (u.submenu = []),
            u.submenu.push({
                label: e
            }),
            u = u.submenu[u.submenu.length - 1]),
            r === t.length - 1 && (u.click = n.click)
        }))
    }))
}

function doExtractFFT() {
    console.log("doExtractFFT");
    return;
    this._doExtractFFT(UpdateTextureProperty);
}

function _doExtractFFT(callback) {
    try {
        let selection = Editor.Selection.curSelection('asset');
        if (selection.length === 0) {
            console.log("[VIS] 未选中声音文件");
            return;
        }

        let uuid = selection[0];
        if (!isAudioFile(uuid)) {
            console.log("[VIS] 未选中声音文件");
            return;
        }

        let path = Editor.assetdb.remote.uuidToFspath(uuid);
        let Generator = require("./FFTTextureGenerator");
        let generator = new Generator;
        generator.Generate(uuid, path, callback);
    } catch (e) {
        console.error(e);
    } finally {
        
    }
}

function UpdateTextureProperty(param) {
    let outputPath = param;
    try {
        // refresh asset db
        let assetdb = Editor.assetdb;
        let url = assetdb.fspathToUrl(outputPath);
        url = Path.dirname(url);
        console.log(`[VIS] refresh ${url}`);
        assetdb.refresh(url, (err, results) => {
            if (err) {
                console.log('[VIS]', err);
                return;
            }

            let outUuid = assetdb.fspathToUuid(outputPath);
            console.log(`[VIS] outUuid = ${outUuid}`);
            let meta = assetdb.loadMetaByUuid(outUuid);
            if (meta) {
                meta.filterMode = 'point';
                meta.packable = false;

                // Editor自带的meta功能太难用了，stringify meta时还不包含subMeta信息。改用自己读写meta文件。
                let metaPath = outputPath + ".meta";
                let data = Fs.readFileSync(metaPath, 'utf8');
                let obj = JSON.parse(data);
                obj.filterMode = 'point';
                obj.packable = false;
                Fs.writeFileSync(metaPath, JSON.stringify(obj, null, 2));
                console.log("[VIS] meta updated");
                console.log("[VIS] finished");

                /*var cache = [];
                var str = JSON.stringify(meta, function(key, value) {
                    if (key.startsWith('_'))
                        return undefined;

                    if (typeof value === 'object' && value !== null) {
                        if (cache.indexOf(value) !== -1) {
                            // 移除
                            return undefined;
                        }
                        // 收集所有的值
                        cache.push(value);
                    }
                    return value;
                });

                cache = null;
                console.log(`[VIS] ${str}`);
                // assetdb.saveMeta(url, str, (err, meta) => {
                //     console.log("[VIS] meta updated");
                //     console.log("[VIS] finished");
                // });*/
            }
        });
    } catch (e) {
        console.log(e);
    }
}

exports.methods = {
    extractFFT: function() {
        doExtractFFT();
    }
},

exports.load = load,
exports.unload = unload;
