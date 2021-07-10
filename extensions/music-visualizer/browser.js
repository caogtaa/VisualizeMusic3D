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
}
;
Object.defineProperty(exports, "__esModule", {
    value: !0
});
var electron_1 = require("electron")
  , Pkg = __importStar(require("./package.json"))
  , fs_1 = require("fs")
  , path_1 = require("path")
  , CFG_PATH = path_1.join(__dirname, "./.menu-config.json");
fs_1.existsSync(CFG_PATH) || fs_1.writeFileSync(CFG_PATH, JSON.stringify({
    assets: [],
    hierarchy: []
}));
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
function hookFunc(e) {
    var n = require(CFG_PATH);
    for (var t in n) {
        var r = n[t];
        switch (t) {
        case "assets":
            assetsMenu(e, r);
            break;
        case "hierarchy":
            hierarchyMenu(e, r)
        }
    }
}
function assetsMenu(e, n) {
    0 !== e.length && e[0].label === Editor.I18n.t(Pkg.name + ".createFile") && e[0].submenu && 0 !== e[0].submenu.length && e[0].submenu[0].label === Editor.I18n.t(Pkg.name + ".createDir") && extendMenu(e, n)
}
function hierarchyMenu(e, n) {
    0 !== e.length && e[0].label === Editor.I18n.t(Pkg.name + ".createNode") && e[0].submenu && 0 !== e[0].submenu.length && e[0].submenu[0].label === Editor.I18n.t(Pkg.name + ".createEmptyNode") && extendMenu(e, n)
}
function extendMenu(e, n) {
    n.forEach((function(n) {
        var t = n.label.split("/")
          , r = e.findIndex((function(e) {
            return e && e.label === t[0]
        }
        ));
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
            r === t.length - 1 && fs_1.existsSync(n.path) && (u.click = require(n.path))
        }
        ))
    }
    ))
}
exports.methods = {
    openPanel: function() {
        Editor.Panel.open("right-menu")
    },
    updateMenu: function(e) {
        delete require.cache[e]
    },
    extractFFT: function() {
        console.log("extractFFT");
    }
},
exports.load = load,
exports.unload = unload;
