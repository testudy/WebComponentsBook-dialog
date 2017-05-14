(function (global, $, jenga) {

    'use strict';

    function getScrollbarWidth(parentEl) {
        var innerCss = {
            width: '100%',
            height: '200px'
        };
        var outerCss = {
            position: 'absolute',
            top: 0,
            left: 0,
            'z-index': -1,
            width: '200px',
            // outer element height is smaller than inner element height
            // this will cause a scrollbar
            height: '150px',
            visibility: 'hidden',
            overflow: 'scroll'
        };
        var $inner = $('<div>test</div>').css(innerCss);
        var $outer = $('<div></div>').css(outerCss).append($inner);
        var outerEl = $outer[0];

        $(parentEl || 'body').append(outerEl);
        // get the layout width of the the inner element inlcuding the scrollbar
        var outerWidth = outerEl.offsetWidth;
        // get the inner width of the outer element, but do not include the scrollbar
        var innerWidth = outerEl.clientWidth;
        // remove the elements from the DOM
        $outer.remove();

        // subtract the outer element width from the inner element width
        // this difference is the width of the scrollbar
        return (outerWidth - innerWidth);
    }

    // cache value for cases where scrollbar widths are consistent
    var scrollbarWidth = getScrollbarWidth();

    // scrollWidth, scrollHeight will be a larger value than the actual
    // width or height of the element itself if the content exceeds the
    // width or height; if it is a larger value then the scrollbar width
    // needs to be accounted for when positioning the overlay element
    function getScrollbarOffset(el) {
        var $el = $(el);
        var body = global.document.body;
        var scrollWidth = el === global ? body.scrollWidth : el.scrollWidth;
        var scrollHeight = el === global ? body.scrollHeight : el.scrollHeight;
        var scrollbarWidth = getScrollbarWidth(el === global ? body : el);

        return {
            x: scrollWidth > $el.outerWidth() ? scrollbarWidth : 0,
            y: scrollHeight > $el.outerHeight() ? scrollbarWidth : 0
        };
    }

    // used to get the margins for offset parents
    function getMargins(el) {
        var $el = $(el);
        var marginTop = parseInt($el.css('margin-top'), 10);
        var marginLeft = parseInt($el.css('margin-left'), 10);

        return {
            top: isNaN(marginTop) ? 0 : marginTop,
            left: isNaN(marginLeft) ? 0 : marginLeft
        };
    }

    function getDimensions(el) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Element.getBoundingClientRect
        // relative to the viewport
        var rect;
        // https://api.jquery.com/position/
        // relative to the offset parent
        var offset;
        var margins;

        // if containing element is the window object
        // then use $ methods for getting the width and height
        if (el === global) {
            var width = $(global).width();
            var height = $(global).height();

            rect = {
                right: width,
                left: 0,
                top: 0,
                bottom: height
            };
            offset = {
                top: 0,
                left: 0
            };
            margins = {
                top: 0,
                left: 0
            };
        } else {
            rect = el.getBoundingClientRect();
            offset = $(el).position();
            margins = getMargins(el);
        }

        return {
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
            // top relative to the element's offset parent
            top: offset.top + margins.top,
            // bottom relative to the element's offset parent
            bottom: offset.top + margins.top + (rect.bottom - rect.top),
            // left relative to the element's offset parent
            left: offset.left + margins.left,
            right: offset.left + margins.left + (rect.right - rect.left)
        };
    }

    function bindListeners($offsetParent, callback) {
        // unbind event to ensure that event listener is never bound more than once
        $offsetParent.off('scroll.duvet').on('scroll.duvet', function (e) {
            callback();
        });
        $offsetParent.off('resize.duvet').on('resize.duvet', function (e) {
            callback();
        });
    }

    function position(el, options) {
        var pos = {};
        var $parent = el.parentNode.tagName === 'BODY' ? $(global) : $(el.parentNode);
        var $el = $(el);
        // get the scrollbar offset
        var scrollbarOffset = getScrollbarOffset(el.parentNode.tagName === 'BODY' ? global : el.parentNode);

        //  parent el is the offset parent
        if (el.parentNode !== el.offsetParent) {
            el.parentNode.style.position = 'relative';
        }

        switch (options.align) {
            case 'TL':
                pos.top = 0;
                pos.left = 0;
                break;
            case 'TR':
                pos.top = 0;
                pos.right = 0;
                break;
            case 'BL':
                pos.bottom = 0;
                pos.left = 0;
                break;
            case 'BR':
                pos.bottom = 0;
                pos.right = 0;
                break;
            case 'BC':
                pos.bottom = 0;
                pos.left = (
                        (($parent.outerWidth() - scrollbarOffset.x - $el.outerWidth()) / 2) +
                        $parent.scrollLeft()
                    );
                break;
            case 'TC':
                pos.top = 0;
                pos.left = (
                        (($parent.outerWidth() - scrollbarOffset.x - $el.outerWidth()) / 2) +
                        $parent.scrollLeft()
                    );
                break;
            case 'M':
                pos.left = (
                        (($parent.outerWidth() - scrollbarOffset.x - $el.outerWidth()) / 2) +
                        $parent.scrollLeft()
                    );
                pos.top = (
                        (($parent.outerHeight() - scrollbarOffset.y - $el.outerHeight()) / 2) +
                        $parent.scrollTop()
                    );
                break;
        }

        // if the positions are less than 0 then
        // element being positioned is larger than
        // its container
        pos.left = Math.max(pos.left, 0);
        pos.top = Math.max(pos.top, 0);

        // position the element absolutely and
        // set the top and left properties
        $el.css($.extend({
            position: 'absolute',
            display: 'block'
        }, pos));

        // if the element should not move when the containing
        // element is resized or scrolled then bind event listeners
        // and call the position function
        if (options.fixed && options.align === 'M' && !options.bound) {
            options.bound = true;
            bindListeners($parent, function () {
                position(el, options);
            });
        }
    }

    // 和jenga中代码重复
    function getComputedStyle(element) {
        if (global.getComputedStyle) {
            return global.getComputedStyle(element);
        }

        // 参考：http://snipplr.com/view/13523/ 修改
        if (!global.getComputedStyle) {
            var computedStyle = {};

            for (var i in element.currentStyle) {
                computedStyle[i] = element.currentStyle[i];
            }

            computedStyle.getPropertyValue = function (property) {
                var re = /(\-([a-z]){1})/g;
                if (property === 'float') {
                    property = 'styleFloat';
                }
                if (re.test(property)) {
                    property = property.replace(re, function () {
                        return arguments[2].toUpperCase();
                    });
                }
                return this[property] || null;
            };

            return computedStyle;
        }
    }

    // align the overlay el to another element in the DOM
    function align(el, options) {
        var alignToElDim = getDimensions(options.alignToEl);
        var css = { display: 'block', visibility: 'visible', position: 'absolute' };
        var $el = $(el);

        // hide element, but keep dimensions by setting the visibility to hidden
        $el.css({
            visibility: 'hidden',
            display: 'block',
            'z-index': -1000
        });

        // get element's dimensions
        var elDim = getDimensions(el);

        // use the alignToEl and el dimensions and position to calculate
        // the el's position
        switch (options.align) {
            case 'TL':
                css.top = alignToElDim.top - elDim.height;
                css.left = alignToElDim.left;
                break;
            case 'TR':
                css.top = alignToElDim.top - elDim.height;
                css.left = alignToElDim.right - elDim.width;
                break;
            case 'BL':
                css.top = alignToElDim.bottom;
                css.left = alignToElDim.left;
                break;
            case 'BR':
                css.top = alignToElDim.bottom;
                css.left = alignToElDim.right - elDim.width;
                break;
            case 'BC':
                css.top = alignToElDim.bottom;
                css.left = (alignToElDim.width - elDim.width) / 2 + alignToElDim.left;
                break;
            case 'TC':
                css.top = alignToElDim.top - elDim.height;
                css.left = (alignToElDim.width - elDim.width) / 2 + alignToElDim.left;
                break;
            case 'M':
                css.top = (alignToElDim.height - elDim.height) / 2 + alignToElDim.top;
                css.left = (alignToElDim.width - elDim.width) / 2 + alignToElDim.left;
                break;
        }

        $el.css(css);
    }

    // default options
    var defaults = {
        alignToEl: null,
        align: 'M',
        fixed: true,
        offsets: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    };

    // creates an overlay instance
    function Duvet(el, options) {
        // create references to overlay element
        this.el = el;
        this.$el = $(el);

        // extend default options with developer defined options
        this.setOptions($.extend({}, defaults, options));

        // return instance reference
        return this;
    }

    // positions the overlay element
    Duvet.prototype.position = function (options) {
        // allow for modification of options before positioning
        this.setOptions(options);

        // call private functions (will defined later)
        if (this.options.alignToEl) {
            // if alignToEl is bod then reassign to window since body height
            // is equal to content height
            this.options.alignToEl = this.options.alignToEl.tagName === 'BODY' ?
                $(global)[0] : this.options.alignToEl;
            align(this.el, this.options);
        } else {
            position(this.el, this.options);
        }
        jenga.bringToFront((this.el.parentNode && this.el.parentNode.host) || this.el);
    };

    // sets instance options
    Duvet.prototype.setOptions = function (options) {
        if (options) {
            this.options = $.extend(this.options, options);
        }
    };

    // clears out any developer defined references to ensure
    // that no element references remain, i.e., helps prevent
    // memory leaks!
    Duvet.prototype.destroy = function () {
        var $parent = $(this.el.parentNode);

        // unbind an event handlers
        $parent.off('scroll.duvet');
        $parent.off('resize.duvet');

        // null out references
        this.el = null;
        this.$el = null;

        // clear out any developer defined options
        this.options = defaults;
    };

    global.Duvet = Duvet;

})(this, this.jQuery, this.jenga);