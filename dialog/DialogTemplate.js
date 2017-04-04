(function (global) {
    function DialogTemplate(options) {
        var that = this;
        var scripts;
        this.querySelector = '[role="dialog"]';
        this.template = document.querySelector('#dialog');
        this.options = options;
        this.options.$el = this.querySelector;

        if (!this.el) {
            this.clone = document.importNode(this.template.content, true);
            this.el = this.clone.querySelector(this.querySelector);
            document.body.appendChild(this.clone);
            scripts = document.querySelectorAll('script');
            scripts[scripts.length - 1].onload = function () {
                that.api = new Dialog(that.options);
                if (that.options.onReady) {
                    that.options.onReady();
                }
            };
        } else {
            this.api = new Dialog(this.options);
            if (this.options.onReady) {
                this.options.onReady();
            }
        }

        return this;
    }

    global.DialogTemplate = DialogTemplate;
}(this));