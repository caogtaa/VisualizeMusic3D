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
  , fs_1 = require("fs")
  , path_1 = require("path")
  , CFG_PATH = path_1.join(__dirname, "./.menu-config.json");
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
            console.log("tut2u");
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

exports.methods = {
    openPanel: function() {
        Editor.Panel.open("right-menu")
    },

    extractFFT: function() {
        console.log("extractFFT");
    }
},

exports.load = load,
exports.unload = unload;
