/**
 * loader配置 - svg文件处理
 *
 * 支持inline|url|sprite模式
 */

'use strict';

const path = require('path');
const extend = require('extend');

const env = require('../utils/env');
const isObject = require('../utils/typeof').isObject;
const isUndefined = require('../utils/typeof').isUndefined;
const appendModuleRule = require('../utils/appendModuleRule');
const isInlineResourceQuery = require('../utils/isInlineResourceQuery');
const isUrlResourceQuery = require('../utils/isUrlResourceQuery');
const getBabelConfig = require('../fixtures/babel/getConfig');
const getImageMinConfig = require('../fixtures/imagemin/getConfig');
const SVG_SPRITE_RUNTIME_GENERATOR_PATH = require.resolve(path.join(__dirname, '../fixtures/svgSprite/runtimeGenerator.js'));
const SVG_SPRITE_RUNTIME_GENERATOR_PATH_NOT_REACT = require.resolve(path.join(__dirname, '../fixtures/svgSprite/runtimeGeneratorNotReact.js'));


const regSVGFile = /\.svg$/i;
const REG_SPRITE_SVG = /__sprite$/;
const REG_SPRITE_SVG_NOT_REACT = /__sprite&notrc$/;


const DEFAULT_SVG_SPRITE_OPTIONS = {
    esModule: true,
    svgo: {
        plugins: [{
            removeTitle: true
        },{
            removeAttrs: {
                attrs: ['path:fill']
            }
        }, {convertPathData: false}]
    }
};

module.exports = function (config) {
    const isProd = env.isProd();

    const OUTPUT_SVG_NAME = config.output.imageDir + '/[name]' + (isProd ? '-[hash:8]' : '') + '.[ext]';

    let imageWebpackLoaderOptions;
    let loaderSliceMax = isProd ? 2 : 1;
    if (config.imagemin === false) {
        loaderSliceMax = 1;
    } else {
        imageWebpackLoaderOptions = getImageMinConfig(config.imagemin);
    }

    const SVG_SPRITE_OPTIONS = isUndefined(config.svgSprite) ? {} : config.svgSprite;

    let svgSpriteOptions;
    if (isObject(config.svgSprite)) {
        svgSpriteOptions = extend(true, {}, DEFAULT_SVG_SPRITE_OPTIONS, SVG_SPRITE_OPTIONS);
    } else {
        svgSpriteOptions = extend(true, {}, DEFAULT_SVG_SPRITE_OPTIONS);
    }
    let svgSpriteSvgGoOptions = svgSpriteOptions.svgo;
    delete svgSpriteOptions.svgo;

    let svgSpriteOptionsForNotReact = extend(true, {}, svgSpriteOptions, {
        runtimeGenerator: SVG_SPRITE_RUNTIME_GENERATOR_PATH_NOT_REACT
    });
    let svgSpriteOptionsForReact = extend(true, {}, svgSpriteOptions, {
        runtimeGenerator: SVG_SPRITE_RUNTIME_GENERATOR_PATH
    });

    config = appendModuleRule(config, [{
        test: regSVGFile,
        resourceQuery: REG_SPRITE_SVG_NOT_REACT, // sprite for without react
        use: [{
            loader: 'babel-loader',
            options: getBabelConfig({
                browserslist: config.browserslist
            })
        }, {
            loader: 'svg-sprite-loader',
            options: svgSpriteOptionsForNotReact
        }, {
            loader: 'svgo-loader',
            options: svgSpriteSvgGoOptions
        }]
    }, {
        test: regSVGFile,
        resourceQuery: REG_SPRITE_SVG, // sprite for react
        use: [{
            loader: 'babel-loader',
            options: getBabelConfig({
                browserslist: config.browserslist
            })
        }, {
            loader: 'svg-sprite-loader',
            options: svgSpriteOptionsForReact
        }, {
            loader: 'svgo-loader',
            options: svgSpriteSvgGoOptions
        }]
    }, {
        test: regSVGFile,
        resourceQuery: isInlineResourceQuery, // SVG 内联模式
        use: [{
            loader: 'svg-url-loader',
            options: {
                limit: 0, noquotes: true, encoding: 'base64'
            }
        }]
    }, {
        test: regSVGFile,
        resourceQuery: isUrlResourceQuery,
        use: [{
            loader: 'file-loader',
            options: {
                name: OUTPUT_SVG_NAME
            }
        }, {
            loader: 'image-webpack-loader',
            options: imageWebpackLoaderOptions
        }].slice(0, loaderSliceMax)
    }, {
        test: regSVGFile,
        use: [{
            loader: 'file-loader',
            options: {
                name: OUTPUT_SVG_NAME
            }
        }, {
            loader: 'image-webpack-loader',
            options: imageWebpackLoaderOptions
        }].slice(0, loaderSliceMax)
    }]);

    return config;
};