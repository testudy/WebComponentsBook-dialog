// Eh-neeek-chock
(function (global, $) {

    'use strict';

    // default resize handle css
    // https://developer.mozilla.org/zh-CN/docs/Web/CSS/cursor
    // IE8（XP环境中）会将cursor的单向指针值显示位双向，但由于不支持双向指针的值，暂使用单向指针值
    var handlesCss = {
        width: '10px',
        height: '10px',
        cursor: 'se-resize',
        position: 'absolute',
        display: 'none',
        'background-color': '#000'
    };

    // options defaults
    var defaults = {
        handles: ['BR'],
        handlesCss: {
            TM: $.extend({}, handlesCss, { cursor: 'n-resize', top: 0, left: '50%', 'margin-left': '-5px' }),
            TR: $.extend({}, handlesCss, { cursor: 'ne-resize', top: 0, right: 0 }),
            MR: $.extend({}, handlesCss, { cursor: 'e-resize', top: '50%', right: 0, 'margin-top': '-5px' }),
            BR: $.extend({}, handlesCss, { bottom: 0, right: 0 }),
            BM: $.extend({}, handlesCss, { cursor: 's-resize', bottom: 0, left: '50%', 'margin-left': '-5px' }),
            BL: $.extend({}, handlesCss, { cursor: 'sw-resize', bottom: 0, left: 0 }),
            ML: $.extend({}, handlesCss, { cursor: 'w-resize', top: '50%', left: 0, 'margin-top': '-5px' }),
            TL: $.extend({}, handlesCss, { cursor: 'nw-resize' }),
        }
    };

    // create resizable instance
    function ApacheChief(el, options) {
        this.el = el;
        this.$el = $(el);
        // extend options with developer defined options
        this.options = $.extend(true, {}, defaults, options);

        // create resize handles
        this.createResizeHandles();

        // bind event handlers
        this.bind();
    }

    // create resize handles
    ApacheChief.prototype.createResizeHandles = function () {
        var handlesCss = this.options.handlesCss;
        var handles = this.options.handles;
        var $handles;

        // loop the resize handles CSS hash, create elements,
        // and append them to this.$el
        // data-handle attribute is used to help determine what element
        // properties should be adjusted when resizing
        for (var i = 0; i < handles.length; i++) {
            if (handlesCss[handles[i]]) {
                this.$el
                    .append($('<div class="apache-chief-resize" data-handle="' + handles[i] + '">')
                        .css(handlesCss[handles[i]]));
            }
        }

        $handles = this.$el.find('.apache-chief-resize');
        // ensure that container is an offset parent for positioning handles
        if (this.$el !== $handles.offsetParent()) {
            this.$el.css('position', 'relative');
        }
        $handles.css('display', 'block');
    };

    // get coordinates for resizing
    ApacheChief.prototype.getPositionDiffs = function (pageXDiff, pageYDiff, direction) {
        var diffs = {
            xPos: 0,
            yPos: 0,
            xDim: 0,
            yDim: 0
        };

        switch (direction) {
            case 'TR':
                diffs.yPos = pageYDiff;
                diffs.xDim = pageXDiff;
                diffs.yDim = -pageYDiff;
                break;
            case 'TL':
                diffs.xPos = pageXDiff;
                diffs.yPos = pageYDiff;
                diffs.xDim = -pageXDiff;
                diffs.yDim = -pageYDiff;
                break;
            case 'BL':
                diffs.xPos = pageXDiff;
                diffs.xDim = -pageXDiff;
                diffs.yDim = pageYDiff;
                break;
            case 'ML':
                diffs.xPos = pageXDiff;
                diffs.xDim = -pageXDiff;
                break;
            case 'TM':
                diffs.yPos = pageYDiff;
                diffs.yDim = -pageYDiff;
                break;
            case 'BM':
                diffs.xDim = 0;
                diffs.yDim = pageYDiff;
                break;
            case 'MR':
                diffs.xDim = pageXDiff;
                diffs.yDim = 0;
                break;
            case 'BR':
                diffs.xDim = pageXDiff;
                diffs.yDim = pageYDiff;
                break;
        }

        return diffs;
    };

    // bind event handlers
    ApacheChief.prototype.bind = function () {
        var self = this;

        $(global.document.documentElement).on('mouseup.apache-chief', function (e) {
            if (global.document.releaseCapture) {
                global.document.releaseCapture();
            }
            
            $(global.document.documentElement).off('mousemove.apache-chief');
        });

        this.$el.find('.apache-chief-resize').on('mousedown.apache-chief', function (e) {
            // IE 兼容代码，解决鼠标超出浏览器界外之后依然可以拖动
            // https://developer.mozilla.org/zh-CN/docs/Web/API/Element/setCapture
            // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/releaseCapture
            // https://www.web-tinker.com/article/20241.html
            if (e.target.setCapture) {
                e.target.setCapture();
            }

            var $handle = $(this);
            var direction = $handle.attr('data-handle');
            // if true then the handle moves in a position that only affects width and height
            var adjustPosition = direction !== 'BM' &&
                direction !== 'MR' && direction !== 'BR';
            // get the initial mouse position
            var mousePos = {
                x: e.pageX,
                y: e.pageY
            };

            $(global.document.documentElement).on('mousemove.apache-chief', function (e) {
                //console.log('mousemove');
                // get the differences between the mousedown position and the
                // position from the mousemove events
                var diffs = self.getPositionDiffs(e.pageX - mousePos.x, e.pageY - mousePos.y, direction);
                // get the draggable el current position relative to the document
                var elPos;

                // prevent text selection
                e.preventDefault();

                // adjust the width and height
                self.$el.css({
                    width: self.$el.width() + diffs.xDim,
                    height: self.$el.height() + diffs.yDim
                });

                // adjust the top and bottom
                if (adjustPosition) {
                    elPos = self.$el.position();
                    self.$el.css({
                        top: elPos.top + diffs.yPos,
                        left: elPos.left + diffs.xPos,
                        position: 'absolute'
                    });
                }

                // store the current mouse position
                // to diff with the next mousemove positions
                mousePos = {
                    x: e.pageX,
                    y: e.pageY
                };
            });
        });
    };

    // clean up instance
    ApacheChief.prototype.destroy = function () {
        // remove the resize handles & events
        this.$el.find('.apache-chief-resize').off('mousedown.apache-chief').remove();

        $(global.document.documentElement).off('mouseup.apache-chief');
        $(global.document.documentElement).off('mousemove.apache-chief');

        this.el = null;
        this.$el = null;
        this.options = defaults;
    };

    global.ApacheChief = ApacheChief;

})(this, this.jQuery);