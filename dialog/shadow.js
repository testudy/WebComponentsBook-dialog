(function (global) {
    function shadowFactory(shadow, API, defaultOptions) {
        function Shadow(options) {
            var that = this;
            var scripts;
            this.shadow = shadow;
            this.options = Object.assign({}, defaultOptions, options);

            if (!this.clone) {
                this.clone = document.importNode(this.shadow.content, true);
                this.root = this.options.host.createShadowRoot();
                this.root.appendChild(this.clone);
                this.options.$el = this.root.querySelector(this.options.$el);
                scripts = this.root.querySelectorAll('script');
                scripts[scripts.length - 1].onload = function () {
                    that.api = new global[that.API](that.options);
                    if (that.options.onReady) {
                        that.options.onReady();
                    }
                };
            } else {
                setTimeout(function () {
                    this.api = new global[this.API](this.options);
                    if (this.options.onReady) {
                        this.options.onReady();
                    }
                }, 0);
            }

            return this;
        }

        Shadow.prototype.shadow = shadow;
        Shadow.prototype.API = API;

        return Shadow;
    }

    global.shadowFactory = shadowFactory;
}(this));

(function (global) {
    var shadow = document.querySelector('#dialog');
    global.DialogShadow = shadowFactory(shadow, 'Dialog', {
        $el: '[role="dialog"]',
        alignToEl: document.body,
        align: 'M',
        clone: false
    });
}(this));