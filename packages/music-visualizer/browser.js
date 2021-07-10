/*
 * @Date: 2021-07-10 14:54:33
 * @LastEditors: GT<caogtaa@gmail.com>
 * @LastEditTime: 2021-07-10 15:30:49
 */
'use strict';

// 扩展内定义的方法
exports.methods = {
    log() {
        console.log('Hello World');
    },
};

// 当扩展被启动的时候执行
exports.load = {};

// 当扩展被关闭的时候执行
exports.unload = {};
