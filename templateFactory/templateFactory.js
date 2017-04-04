(function (global) {
    function templateFactory(template, API, defaultOptions) {
        function Template(options) {
            var that = this;
            var scripts;
            this.template = this.template;
            this.options = Object.assign({}, defaultOptions, options);

            if (!this.clone) {
                this.clone = document.importNode(this.template.content, true);
                document.body.appendChild(this.clone);
                scripts = document.querySelectorAll('script');
                scripts[scripts.length - 1].onload = function () {
                    that.api = new global[that.API](that.options);
                    if (that.options.onReady) {
                        that.options.onReady();
                    }
                };
            } else {
                this.api = new global[this.API](this.options);
                if (this.options.onReady) {
                    this.options.onReady();
                }
            }

            return this;
        }

        Template.prototype.template = template;
        Template.prototype.API = API;

        return Template;
    }

    global.templateFactory = templateFactory;
}(this));