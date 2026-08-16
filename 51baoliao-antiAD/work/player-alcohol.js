window['DPLAYER_PREROLL_AD'] = (function () {
    var _0x112536 = 0x5, _0x21659e = 0x5, _0x22fc38 = ![];
    function _0x5e801d(_0x344129) {
        return typeof _0x344129 === 'string' && /^\s*https?:\/\//i['test'](_0x344129);
    }
    function _0x321875(_0x3d1859) {
        if (typeof _0x3d1859 !== 'string')
            return ![];
        if (/\.(gif|png|jpe?g|webp|bmp|svg|avif)(\?|#|$)/i['test'](_0x3d1859))
            return !![];
        if (/^\s*data:image\/(gif|png|jpe?g|webp|bmp|svg\+xml|avif);base64,/i['test'](_0x3d1859))
            return !![];
        return ![];
    }
    function _0x59914a(_0x13a933) {
        if (!_0x13a933 || !_0x13a933['setAttribute'])
            return;
        _0x13a933['setAttribute']('playsinline', 'true'), _0x13a933['setAttribute']('webkit-playsinline', 'true'), _0x13a933['setAttribute']('x5-playsinline', 'true'), _0x13a933['setAttribute']('x5-video-player-type', 'h5-page'), _0x13a933['setAttribute']('x5-video-player-fullscreen', 'false'), _0x13a933['setAttribute']('x5-video-orientation', 'portraint'), _0x13a933['setAttribute']('t7-video-player-type', 'inline');
    }
    function _0x39c807(_0x570cd0) {
        if (!_0x570cd0)
            return null;
        if (_0x570cd0['ads_skip'] === 0x1 || _0x570cd0['ads_skip'] === '1')
            return null;
        if (!Array['isArray'](_0x570cd0['video_player_ads']) || _0x570cd0['video_player_ads']['length'] === 0x0)
            return null;
        var _0x39e247 = [];
        for (var _0x24bdcf = 0x0; _0x24bdcf < _0x570cd0['video_player_ads']['length']; _0x24bdcf++) {
            var _0x16900e = _0x570cd0['video_player_ads'][_0x24bdcf];
            if (_0x16900e && _0x321875(_0x16900e['src']))
                _0x39e247['push'](_0x16900e);
        }
        if (_0x39e247['length'] === 0x0)
            return null;
        var _0x4b1e99 = _0x39e247[Math['floor'](Math['random']() * _0x39e247['length'])], _0x3143bf = +_0x570cd0['ads_duration'] > 0x0 ? +_0x570cd0['ads_duration'] : _0x21659e;
        return {
            'src': _0x4b1e99['src'],
            'url': _0x5e801d(_0x4b1e99['link']) ? _0x4b1e99['link'] : '',
            'totalDuration': _0x3143bf,
            'data-page_key': _0x4b1e99['data-page_key'] || '',
            'data-page_name': _0x4b1e99['data-page_name'] || '',
            'data-ad_slot_key': _0x4b1e99['data-ad_slot_key'] || '',
            'data-ad_slot_name': _0x4b1e99['data-ad_slot_name'] || '',
            'data-ad_id': _0x4b1e99['data-ad_id'] || '',
            'data-creative_id': _0x4b1e99['data-creative_id'] || ''
        };
    }
    var _0x49b1b4 = function (_0x44e478, _0x1d08ef, _0x470cbc) {
        if (!_0x44e478 || !_0x44e478['video'] || !_0x470cbc || !_0x470cbc['src'])
            return _0x44e478;
        var _0xe96461 = _0x44e478['video'], _0x377251 = _0x44e478['container'], _0x306c00 = Number(_0x1d08ef && _0x1d08ef['preroll_ad_load_timeout']), _0x4c02b7 = _0x306c00 > 0x0 ? _0x306c00 : _0x112536, _0x1ea555 = _0x4c02b7 * 0x3e8, _0x1eb18f = _0x470cbc['totalDuration'], _0xc96940 = _0x470cbc['url'] && typeof _0x470cbc['url'] === 'string' && _0x470cbc['url']['length'] > 0x0 ? _0x470cbc['url'] : '', _0x47623f = (function () {
                try {
                    return !!_0xe96461['muted'];
                } catch (_0xba52c2) {
                    return ![];
                }
            }()), _0x1858ea = ![];
        function _0x1bd66e() {
            if (document['getElementById']('dplayer-pre-style-v1'))
                return;
            var _0x27b6bb = document['createElement']('style');
            _0x27b6bb['id'] = 'dplayer-pre-style-v1', _0x27b6bb['textContent'] = [
                '.dplayer.dplayer-pre-playing\x20.dplayer-controller{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20.dplayer-mask{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20.dplayer-bezel{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20.dplayer-info-panel{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20.dplayer-comment{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20.dplayer-danmaku{display:none!important}',
                '.dplayer.dplayer-pre-playing\x20video{cursor:default!important}',
                '.dplayer.dplayer-pre-playing.dplayer-pre-clickable\x20video{cursor:pointer!important}',
                '.dplayer-pre-bg{position:absolute;inset:0;background:#000;z-index:4;pointer-events:none}',
                '.dplayer-pre-img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;margin:0!important;padding:0!important;border:0!important;object-fit:contain;background:#000;z-index:5;user-select:none;-webkit-user-drag:none;display:block!important}',
                '.dplayer.dplayer-pre-clickable\x20.dplayer-pre-img{cursor:pointer;object-fit:contain}',
                '.dplayer-pre-countdown{position:absolute;top:8px;right:8px;z-index:6;background:rgba(0,0,0,.6);color:#fff;font-size:13px;padding:4px\x2010px;border-radius:4px;pointer-events:none;user-select:none;font-family:-apple-system,BlinkMacSystemFont,\x22Segoe\x20UI\x22,sans-serif;line-height:1.4;letter-spacing:.5px}'
            ]['join'](''), document['head']['appendChild'](_0x27b6bb);
        }
        function _0xade718() {
            if (_0x1858ea)
                return;
            _0x1858ea = !![], _0xe96461['removeEventListener']('play', _0xade718);
            if (_0x22fc38)
                return;
            _0x22fc38 = !![];
            try {
                _0xe96461['muted'] = !![];
            } catch (_0x5a1811) {
            }
            try {
                _0xe96461['pause']();
            } catch (_0x49912d) {
            }
            _0x11f09d();
        }
        _0xe96461['addEventListener']('play', _0xade718);
        _0x44e478['events'] && _0x44e478['events']['on']('destroy', function () {
            _0xe96461['removeEventListener']('play', _0xade718);
        });
        function _0x11f09d() {
            _0x1bd66e(), _0x377251['classList']['add']('dplayer-pre-playing');
            if (_0xc96940)
                _0x377251['classList']['add']('dplayer-pre-clickable');
            _0x44e478['__inPreRollAd'] = !![];
            var _0x8cc33a = document['createElement']('div');
            _0x8cc33a['className'] = 'dplayer-pre-bg', _0x377251['appendChild'](_0x8cc33a);
            var _0x45dcd8 = document['createElement']('div');
            _0x45dcd8['className'] = 'dplayer-pre-countdown', _0x45dcd8['textContent'] = '视频加载中…', _0x377251['appendChild'](_0x45dcd8);
            var _0x563dea = ![], _0x50dea5 = null, _0x4c87dc = null;
            function _0x2e5f8e(_0x1255fa) {
                try {
                    _0x1255fa['stopImmediatePropagation']();
                } catch (_0x2d4821) {
                }
                try {
                    _0x1255fa['preventDefault']();
                } catch (_0x22987c) {
                }
            }
            document['addEventListener']('keydown', _0x2e5f8e, !![]);
            var _0x1379d1 = document['createElement']('img');
            _0x1379d1['className'] = 'dplayer-pre-img', _0x1379d1['alt'] = '', _0x1379d1['draggable'] = ![], _0x1379d1['decoding'] = 'async', _0x1379d1['className'] = 'tjtagmanager\x20' + _0x1379d1['className'], _0x1379d1['setAttribute']('data-event', 'ad_click'), _0x1379d1['setAttribute']('data-ad_type', 'banner'), _0x1379d1['setAttribute']('data-page_key', _0x470cbc['data-page_key'] || ''), _0x1379d1['setAttribute']('data-page_name', _0x470cbc['data-page_name'] || ''), _0x1379d1['setAttribute']('data-ad_slot_key', _0x470cbc['data-ad_slot_key'] || ''), _0x1379d1['setAttribute']('data-ad_slot_name', _0x470cbc['data-ad_slot_name'] || ''), _0x1379d1['setAttribute']('data-ad_id', _0x470cbc['data-ad_id'] || ''), _0x1379d1['setAttribute']('data-creative_id', _0x470cbc['data-creative_id'] || '');
            function _0x4280ea() {
                if (_0x563dea)
                    return;
                var _0x1e7bbb = _0x1eb18f;
                _0x45dcd8['textContent'] = _0x1e7bbb + 's\x20后关闭', _0x50dea5 = setInterval(function () {
                    _0x1e7bbb--, _0x45dcd8['textContent'] = (_0x1e7bbb > 0x0 ? _0x1e7bbb : 0x0) + 's\x20后关闭';
                    if (_0x1e7bbb <= 0x0)
                        _0x253d86();
                }, 0x3e8);
            }
            function _0x4e86ac() {
                if (_0x563dea)
                    return;
                console['warn']('[dp-pre]\x20image\x20ad\x20load\x20failed:', _0x470cbc['src']), _0x253d86();
            }
            function _0x1f500f() {
                if (!_0xc96940)
                    return;
                try {
                    window['open'](_0xc96940, '_blank');
                } catch (_0x5d2f99) {
                }
                _0x253d86();
            }
            _0x1379d1['addEventListener']('load', _0x4280ea), _0x1379d1['addEventListener']('error', _0x4e86ac), _0x1379d1['addEventListener']('click', _0x1f500f);
            function _0x253d86(_0x116f59) {
                if (_0x563dea)
                    return;
                _0x563dea = !![];
                _0x50dea5 && (clearInterval(_0x50dea5), _0x50dea5 = null);
                _0x4c87dc && (clearTimeout(_0x4c87dc), _0x4c87dc = null);
                try {
                    document['removeEventListener']('keydown', _0x2e5f8e, !![]);
                } catch (_0x4129de) {
                }
                try {
                    _0x1379d1['removeEventListener']('load', _0x4280ea), _0x1379d1['removeEventListener']('error', _0x4e86ac), _0x1379d1['removeEventListener']('click', _0x1f500f);
                } catch (_0x400bd5) {
                }
                if (_0x1379d1['parentNode'])
                    try {
                        _0x1379d1['parentNode']['removeChild'](_0x1379d1);
                    } catch (_0x231184) {
                    }
                if (_0x45dcd8 && _0x45dcd8['parentNode'])
                    try {
                        _0x45dcd8['parentNode']['removeChild'](_0x45dcd8);
                    } catch (_0x3194f6) {
                    }
                if (_0x8cc33a && _0x8cc33a['parentNode'])
                    try {
                        _0x8cc33a['parentNode']['removeChild'](_0x8cc33a);
                    } catch (_0x380eae) {
                    }
                _0x377251['classList']['remove']('dplayer-pre-playing'), _0x377251['classList']['remove']('dplayer-pre-clickable');
                try {
                    _0xe96461['muted'] = _0x47623f;
                    if (!_0x116f59) {
                        var _0x40d5e2 = _0xe96461['play']();
                        if (_0x40d5e2 && typeof _0x40d5e2['catch'] === 'function')
                            _0x40d5e2['catch'](function () {
                            });
                    }
                } catch (_0x26cf92) {
                    console['error']('[dp-pre]\x20image\x20ad\x20resume\x20main\x20failed:', _0x26cf92);
                }
                _0x44e478['__inPreRollAd'] = ![], _0x44e478['__justExitedAd'] = !![], setTimeout(function () {
                    _0x44e478['__justExitedAd'] = ![];
                }, 0x1f4);
            }
            _0x44e478['__killAd'] = function () {
                _0x253d86(!![]);
            }, _0x1ea555 > 0x0 && (_0x4c87dc = setTimeout(function () {
                _0x4c87dc = null;
                if (_0x563dea)
                    return;
                if (!_0x1379d1['complete'] || _0x1379d1['naturalWidth'] === 0x0)
                    _0x253d86();
            }, _0x1ea555)), _0x1379d1['setAttribute']('z-image-loader-url', _0x470cbc['src']), _0x377251['appendChild'](_0x1379d1);
        }
        return _0x44e478;
    };
    function _0x46d6b8(_0x198de) {
        if (!_0x198de || !_0x198de['video'])
            return;
        var _0xa60dcd = _0x198de['video'];
        function _0x62bbfb() {
            if (_0x198de['__inPreRollAd'])
                return;
            var _0x5953b6 = !!_0xa60dcd['muted'];
            try {
                _0xa60dcd['muted'] = !![];
            } catch (_0x352c07) {
            }
            var _0x127fb8 = ![];
            function _0x4339c2() {
                if (_0x127fb8)
                    return;
                _0x127fb8 = !![];
                try {
                    _0xa60dcd['removeEventListener']('play', _0x4339c2);
                } catch (_0x3e8911) {
                }
                try {
                    _0xa60dcd['muted'] = _0x5953b6;
                } catch (_0x3b7ee4) {
                }
            }
            _0xa60dcd['addEventListener']('play', _0x4339c2), setTimeout(_0x4339c2, 0x12c);
        }
        _0xa60dcd['addEventListener']('pause', _0x62bbfb), _0x198de['events'] && _0x198de['events']['on']('destroy', function () {
            try {
                _0xa60dcd['removeEventListener']('pause', _0x62bbfb);
            } catch (_0x2924e9) {
            }
        });
    }
    return {
        'pickAdConfig': _0x39c807,
        'attachPreRollAd': _0x49b1b4,
        'patchVideoInline': _0x59914a,
        'attachPauseAudioCleanup': _0x46d6b8
    };
}()), function (_0x2feada) {
    'use strict';
    var _0x259115 = !![], _0x13e0b8 = localStorage['getItem']('tjtag_ab'), _0x503e6f = {
            'isIOS': function () {
                return /\(i[^;]+;( U;)? CPU.+Mac OS X/['test'](navigator['userAgent']) || navigator['platform'] === 'MacIntel' && navigator['maxTouchPoints'] > 0x1;
            },
            'isUC': function () {
                return /UCBrowser|UCWEB|UCTurbo|UCLite|\bUBrowser\b/i['test'](navigator['userAgent']);
            },
            'isHlsUrl': function (_0x4ae4ff) {
                return /\.m3u8(\?|$)/i['test'](_0x4ae4ff || '');
            },
            'querySelectorAll': function (_0x25077c) {
                if (document['querySelectorAll'])
                    return document['querySelectorAll'](_0x25077c);
                var _0x26ab3a = _0x25077c['charAt'](0x0);
                if (_0x26ab3a === '.')
                    return document['getElementsByClassName'](_0x25077c['substring'](0x1));
                if (_0x26ab3a === '#') {
                    var _0x7e0bed = document['getElementById'](_0x25077c['substring'](0x1));
                    return _0x7e0bed ? [_0x7e0bed] : [];
                }
                return document['getElementsByTagName'](_0x25077c);
            },
            'jsonParse': function (_0x53de2d) {
                try {
                    return JSON['parse'](_0x53de2d);
                } catch (_0x204eb1) {
                    return null;
                }
            },
            'isOpenAB': function () {
                return !!_0x13e0b8;
            },
            'isOpenABByOldDplayerChain': function (_0x461064) {
                _0x461064 = _0x461064 || _0x503e6f['jsonParse'](_0x13e0b8) || {};
                var _0x4485ba = _0x461064 && _0x461064['funstatus'] || {}, _0x78d463 = String(_0x4485ba['DPLAYER'] != null ? _0x4485ba['DPLAYER'] : '')['trim'](), _0x1fb216 = _0x78d463 !== '101' && _0x78d463 !== '1';
                return _0x503e6f['isOpenAB']() && console['log'](_0x1fb216 ? '[player]\x20AB测已开启-A组\x20→\x20原H264直链' : '[player]\x20AB测已开启-B组\x20→\x20H265适配链'), _0x1fb216;
            },
            'isSafeHttpUrl': function (_0x4d31e4) {
                if (!_0x4d31e4 || typeof _0x4d31e4 !== 'string')
                    return ![];
                try {
                    var _0x29b228 = new URL(_0x4d31e4, window['location']['href']);
                    return _0x29b228['protocol'] === 'http:' || _0x29b228['protocol'] === 'https:';
                } catch (_0x17749c) {
                    return ![];
                }
            },
            'applyInlineAttrs': function (_0x27e171) {
                if (!_0x27e171)
                    return;
                _0x27e171['setAttribute']('playsinline', ''), _0x27e171['setAttribute']('webkit-playsinline', ''), _0x27e171['setAttribute']('x5-playsinline', ''), _0x27e171['setAttribute']('x5-video-player-type', 'h5'), _0x27e171['setAttribute']('x5-video-player-fullscreen', 'false'), _0x27e171['setAttribute']('x5-video-orientation', 'portraint'), _0x27e171['setAttribute']('preload', 'auto');
            },
            'deepClone': function _0x53665e(_0x34115d) {
                if (_0x34115d === null || typeof _0x34115d !== 'object')
                    return _0x34115d;
                if (_0x34115d instanceof Date)
                    return new Date(_0x34115d['getTime']());
                if (Array['isArray'](_0x34115d)) {
                    var _0x5dd21d = [];
                    for (var _0x24a3a4 = 0x0; _0x24a3a4 < _0x34115d['length']; _0x24a3a4++)
                        _0x5dd21d[_0x24a3a4] = _0x53665e(_0x34115d[_0x24a3a4]);
                    return _0x5dd21d;
                }
                var _0x5098ee = {};
                for (var _0x403dca in _0x34115d) {
                    if (Object['prototype']['hasOwnProperty']['call'](_0x34115d, _0x403dca))
                        _0x5098ee[_0x403dca] = _0x53665e(_0x34115d[_0x403dca]);
                }
                return _0x5098ee;
            },
            'diagnose': async function (_0x52a872) {
                var _0x3b77d3 = document['createElement']('video'), _0x5cdbf8 = {
                        'hls': _0x3b77d3['canPlayType']('application/vnd.apple.mpegurl'),
                        'avc': _0x3b77d3['canPlayType']('video/mp4;\x20codecs=\x22avc1.640028\x22'),
                        'aac': _0x3b77d3['canPlayType']('audio/mp4;\x20codecs=\x22mp4a.40.2\x22'),
                        'hevc': _0x3b77d3['canPlayType']('video/mp4;\x20codecs=\x22hvc1.1.6.L120.90\x22'),
                        'mse': !!(window['ManagedMediaSource'] || window['MediaSource']),
                        'hlsjs': !!(window['Hls'] && window['Hls']['isSupported'] && window['Hls']['isSupported']()),
                        'ua': navigator['userAgent']
                    };
                console['table'](_0x5cdbf8);
                if (_0x52a872)
                    try {
                        var _0x1505d5 = await fetch(_0x52a872, { 'cache': 'no-store' });
                        _0x5cdbf8['manifest'] = _0x1505d5['status'], console['log']('[player]\x20清单\x20HTTP', _0x1505d5['status'], _0x52a872);
                    } catch (_0x4735cb) {
                        _0x5cdbf8['manifest'] = 'fetch\x20failed:\x20' + _0x4735cb['message'], console['warn']('[player]\x20清单拉取失败', _0x4735cb['message'], _0x52a872);
                    }
                return _0x5cdbf8;
            },
            'errorTips': function (_0x33acbe, _0x2c25fa, _0x3f059b) {
                var _0x18dbfb = document['getElementById']('wjErrorTips');
                if (!_0x18dbfb)
                    return;
                _0x18dbfb['innerHTML'] = '<span\x20class=\x22px-2.5\x20py-0.5\x20rounded-full\x20text-xs\x20font-semibold\x20' + _0x2c25fa + '\x22>' + _0x33acbe + '</span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22text-slate-500\x20dark:text-slate-400\x22>' + _0x3f059b + '</span>';
            },
            'resolvePlay': async function (_0x4aac52, _0x3c9f3c) {
                var _0x45f29b = _0x4aac52['video_h264'] && _0x4aac52['video_h264']['url'] || _0x4aac52['video'] && _0x4aac52['video']['url'] || _0x3c9f3c['src'], _0x15b502 = _0x4aac52['video_h265'] && _0x4aac52['video_h265']['url'] || null;
                if (!_0x45f29b && !_0x15b502)
                    return console['error']('[player]\x20视频地址为空'), null;
                if (_0x503e6f['isOpenAB']() && _0x503e6f['isOpenABByOldDplayerChain']())
                    return {
                        'engine': typeof Hls !== 'undefined' && Hls['isSupported']() ? 'hlsjs' : 'native',
                        'url': _0x45f29b
                    };
                if (typeof H265 !== 'undefined' && H265['support']) {
                    var _0x2f35a7 = await H265['support']({
                        'h265': _0x15b502,
                        'h264': _0x45f29b,
                        'playerProbe': _0x259115
                    });
                    if (!_0x2f35a7['codec'])
                        return _0x503e6f['errorTips']('无法播放', 'bg-red-100\x20text-red-700\x20dark:bg-red-500/15\x20dark:text-red-400', '所有档位都失败了'), console['error']('[player]\x20H.265/H.264\x20均无法播放', _0x2f35a7['error'] || ''), {
                            'engine': typeof Hls !== 'undefined' && Hls['isSupported']() ? 'hlsjs' : 'native',
                            'url': _0x45f29b
                        };
                    return _0x503e6f['errorTips'](_0x2f35a7['codec'] === 'h265' ? 'H.265' : 'H.264', _0x2f35a7['codec'] === 'h265' ? 'bg-emerald-100\x20text-emerald-700\x20dark:bg-emerald-500/15\x20dark:text-emerald-400' : 'bg-amber-100\x20text-amber-700\x20dark:bg-amber-500/15\x20dark:text-amber-400', _0x2f35a7['tier'] + '\x20·\x20engine=' + _0x2f35a7['engine']), console['log']('[player]\x20H265.support\x20→', _0x2f35a7['codec'], '/', _0x2f35a7['engine'], '/', _0x2f35a7['tier']), {
                        'engine': _0x2f35a7['engine'],
                        'url': _0x2f35a7['url']
                    };
                }
                return {
                    'engine': typeof Hls !== 'undefined' && Hls['isSupported']() ? 'hlsjs' : 'native',
                    'url': _0x45f29b
                };
            }
        }, _0x49130a = [];
    function _0x302a6d(_0x40413e, _0x403880) {
        (async function () {
            var {
                engine: _0x4a04a1,
                url: _0x23239d
            } = await _0x503e6f['resolvePlay'](_0x403880 && _0x403880['options'] || {}, _0x40413e) || {};
            if (!_0x23239d) {
                console['error']('[player]\x20视频地址为空');
                return;
            }
            _0x503e6f['diagnose'](_0x23239d);
            if (_0x4a04a1 === 'hlsjs' && typeof Hls !== 'undefined' && Hls['isSupported']()) {
                console['log']('[player]\x20使用\x20寄生HLS播放');
                var _0x51549f = new Hls({
                    'maxBufferLength': 0xa,
                    'maxMaxBufferLength': 0x1e,
                    'maxStarvationDelay': 0x4,
                    'maxLoadingDelay': 0x4,
                    'startLevel': -0x1,
                    'capLevelToPlayerSize': !![],
                    'manifestLoadingMaxRetry': 0x4,
                    'levelLoadingMaxRetry': 0x4,
                    'fragLoadingMaxRetry': 0x6,
                    'enableWorker': !![],
                    'lowLatencyMode': ![]
                });
                _0x51549f['loadSource'](_0x23239d), _0x51549f['attachMedia'](_0x40413e), _0x51549f['on'](Hls['Events']['ERROR'], function (_0x413eed, _0x81f7df) {
                    if (!_0x81f7df['fatal'])
                        return;
                    switch (_0x81f7df['type']) {
                    case Hls['ErrorTypes']['NETWORK_ERROR']:
                        console['warn']('[hls]\x20网络错误,尝试恢复', _0x81f7df), _0x51549f['startLoad']();
                        break;
                    case Hls['ErrorTypes']['MEDIA_ERROR']:
                        console['warn']('[hls]\x20媒体错误,尝试恢复', _0x81f7df), _0x51549f['recoverMediaError']();
                        break;
                    default:
                        console['error']('[hls]\x20致命错误,销毁实例', _0x81f7df), _0x51549f['destroy']();
                    }
                }), _0x403880['hls'] = _0x51549f, _0x49130a['push'](_0x51549f);
                return;
            }
            if (window['Hls'] && Hls['isSupported']() && !_0x503e6f['isUC']()) {
                console['log']('[player]\x20使用托管HLS播放');
                var _0x51549f = new Hls();
                _0x51549f['loadSource'](_0x23239d), _0x51549f['attachMedia'](_0x40413e);
                return;
            }
            if (_0x40413e['canPlayType']('application/vnd.apple.mpegurl') || _0x40413e['canPlayType']('application/x-mpegURL')) {
                console['log']('[player]\x20使用原生HLS播放'), _0x40413e['src'] = _0x23239d;
                return;
            }
            console['error']('[player]\x20当前浏览器不支持\x20HLS\x20播放');
        }());
    }
    var _0x2c1520 = [];
    function _0x380967(_0x54c131, _0x20f174) {
        if (!_0x54c131 || !_0x20f174 || !_0x20f174['video'] || !_0x20f174['video']['url'])
            return console['warn']('[player]\x20跳过初始化:缺少\x20element\x20或\x20video.url', {
                'ele': !!_0x54c131,
                'conf': _0x20f174
            }), null;
        if (_0x54c131['__dpLoaded'])
            return null;
        _0x54c131['__dpLoaded'] = !![], _0x20f174['container'] = _0x54c131;
        _0x20f174['video'] && _0x20f174['video']['url'] && _0x503e6f['isHlsUrl'](_0x20f174['video']['url']) && ((!_0x20f174['video']['type'] || _0x20f174['video']['type'] === 'auto' || _0x20f174['video']['type'] === 'hls') && (_0x20f174['video']['type'] = 'customHls', _0x20f174['video']['customType'] = _0x20f174['video']['customType'] || {}, !_0x20f174['video']['customType']['customHls'] && (_0x20f174['video']['customType']['customHls'] = _0x302a6d), _0x20f174['video_h264'] = _0x503e6f['deepClone'](_0x20f174['video']), _0x20f174['video']['url'] = ''));
        if (_0x20f174['open_danmaku'] == 0x1 && !_0x503e6f['isIOS']()) {
            var _0x5ce162 = window['location']['pathname']['split']('/'), _0x51caf7 = _0x5ce162[0x2] || '';
            _0x20f174['danmaku'] = _0x20f174['danmaku'] || {
                'id': _0x51caf7,
                'api': '/danmaku/' + _0x51caf7 + '.json#',
                'opacity': 0.7
            };
        }
        var _0x4c676d = {
            'autoplay': ![],
            'theme': '#4a90e2',
            'lang': 'zh-cn',
            'screenshot': !![],
            'hotkey': !![],
            'preload': 'auto',
            'volume': 0.7,
            'mutex': !![]
        };
        for (var _0x2c5b4c in _0x4c676d) {
            if (typeof _0x20f174[_0x2c5b4c] === 'undefined')
                _0x20f174[_0x2c5b4c] = _0x4c676d[_0x2c5b4c];
        }
        if (_0x20f174['autoplay'])
            _0x20f174['muted'] = !![];
        var _0x407f4c = DPLAYER_PREROLL_AD['pickAdConfig'](_0x20f174), _0xfc9e19 = new DPlayer(_0x20f174);
        return _0x503e6f['applyInlineAttrs'](_0xfc9e19['video']), _0x407f4c ? (DPLAYER_PREROLL_AD['patchVideoInline'](_0xfc9e19['video']), DPLAYER_PREROLL_AD['attachPreRollAd'](_0xfc9e19, _0x20f174, _0x407f4c)) : DPLAYER_PREROLL_AD['patchVideoInline'](_0xfc9e19['video']), DPLAYER_PREROLL_AD['attachPauseAudioCleanup'](_0xfc9e19), _0xfc9e19['video']['addEventListener']('play', function () {
            for (var _0x1bea43 = 0x0; _0x1bea43 < _0x2c1520['length']; _0x1bea43++) {
                var _0x14303f = _0x2c1520[_0x1bea43];
                if (_0x14303f === _0xfc9e19)
                    continue;
                if (typeof _0x14303f['__killAd'] === 'function')
                    _0x14303f['__killAd']();
            }
        }), _0xfc9e19;
    }
    function _0x3b8f60() {
        if (typeof DPlayer === 'undefined')
            return;
        var _0x1bb3ec = _0x503e6f['querySelectorAll']('.dplayer');
        if (!_0x1bb3ec || _0x1bb3ec['length'] === 0x0)
            return;
        for (var _0x2955ab = 0x0; _0x2955ab < _0x1bb3ec['length']; _0x2955ab++) {
            var _0x46ac2d = _0x1bb3ec[_0x2955ab];
            if (_0x46ac2d['__dpLoaded'])
                continue;
            var _0x4d5a29 = _0x46ac2d['getAttribute']('data-config');
            if (!_0x4d5a29)
                continue;
            try {
                var _0x2ce8a2 = _0x503e6f['jsonParse'](_0x4d5a29);
                if (!_0x2ce8a2)
                    continue;
                var _0x4a7ef9 = _0x380967(_0x46ac2d, _0x2ce8a2);
                if (_0x4a7ef9)
                    _0x2c1520['push'](_0x4a7ef9);
            } catch (_0x3ab9b1) {
                console['error']('[player]\x20加载失败', _0x3ab9b1), _0x46ac2d['innerHTML'] = '<div\x20style=\x22background:#5e5c5c;color:red;font-size:1.5rem;height:6rem;line-height:6rem;text-align:center\x22>视频加载出错,请稍后再试</div>';
            }
        }
    }
    function _0x505b15() {
        for (var _0x21844d = 0x0; _0x21844d < _0x2c1520['length']; _0x21844d++) {
            var _0x4ddd65 = _0x2c1520[_0x21844d];
            try {
                if (_0x4ddd65 && _0x4ddd65['container'])
                    _0x4ddd65['container']['__dpLoaded'] = ![];
                _0x4ddd65['destroy']();
            } catch (_0x1d58bb) {
            }
        }
        _0x2c1520 = [];
        for (var _0x50a5f5 = 0x0; _0x50a5f5 < _0x49130a['length']; _0x50a5f5++) {
            try {
                _0x49130a[_0x50a5f5]['destroy']();
            } catch (_0x463b11) {
            }
        }
        _0x49130a = [];
    }
    document['readyState'] === 'loading' ? document['addEventListener']('DOMContentLoaded', _0x3b8f60, ![]) : _0x3b8f60();
    window['addEventListener']('load', _0x3b8f60, ![]), setTimeout(function () {
        var _0x132013 = setInterval(function () {
            typeof DPlayer !== 'undefined' && (_0x3b8f60(), clearInterval(_0x132013));
        }, 0x3e8);
        setTimeout(function () {
            clearInterval(_0x132013);
        }, 0x7530);
    }, 0x1388);
    function _0x1d53dc(_0x49c5b1) {
        if (!_0x49c5b1)
            return ![];
        try {
            _0x49c5b1['destroy']();
        } catch (_0x593d0d) {
        }
        var _0x3b56c9 = _0x49130a['indexOf'](_0x49c5b1);
        if (_0x3b56c9 !== -0x1)
            return _0x49130a['splice'](_0x3b56c9, 0x1), !![];
        return ![];
    }
    _0x2feada['PlayerLoader'] = {
        'load': _0x3b8f60,
        'destroy': _0x505b15,
        'create': _0x380967,
        'removeHlsInstance': _0x1d53dc,
        'getInstances': function () {
            return _0x2c1520['slice']();
        },
        'getHlsInstances': function () {
            return _0x49130a['slice']();
        },
        'utils': _0x503e6f
    };
}(typeof window !== 'undefined' ? window : this);