/*
 * @Date: 2021-07-10 21:13:56
 * @LastEditors: GT<caogtaa@gmail.com>
 * @LastEditTime: 2021-07-10 21:28:38
 */

// 模块加载的时候触发的函数
exports.load = function() {};
// 模块卸载的时候触发的函数
exports.unload = function() {};
// 模块内定义的方法
exports.methods = {
    log(str) {
        console.log(str);
        return true;
    },
};
