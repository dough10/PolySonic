/*jslint browser: true*/
/*!
* FitText.js 1.0 jQuery free version
*
* Copyright 2011, Dave Rupert http://daverupert.com
* Released under the WTFPL license
* http://sam.zoy.org/wtfpl/
* Modified by Slawomir Kolodziej http://slawekk.info
*
* Date: Tue Aug 09 2011 10:45:54 GMT+0200 (CEST)
*/
(function (window) {
    "use strict";

    var addEvent = function (el, type, fn) {
            if (el.addEventListener) {
                el.addEventListener(type, fn, false);
            } else {
                el.attachEvent('on' + type, fn);
            }
        };

    window.fitText = function (el, kompressor) {
        var settings = {
                'minFontSize' : -1 / 0,
                'maxFontSize' : 1 / 0
            },

            fit = function (el) {
                var compressor = kompressor || 1,

                    resizer = function () {
                        // Using a for-loop with if-else construction is *slightly* faster (max 3%),
                        // but Math.max() is easier to read and maintain [http://jsperf.com/math-max-vs-if-else]
                        el.style.fontSize = Math.max(Math.min(el.clientWidth / (compressor * 10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize)) + 'px';
                    };

                // Call once to set.
                resizer();

                // Bind events
                // If you have any js library which support Events, replace this part
                // and remove addEvent function (or use original jQuery version)
                addEvent(window, 'resize', resizer);
            },
            i,
            numElements = el.length;

        if (numElements) {
            for (i = 0; i < numElements; i += 1) {
                fit(el[i]);
            }
        } else {
            fit(el);
        }

        // return set of elements
        return el;
    };
}(this));
