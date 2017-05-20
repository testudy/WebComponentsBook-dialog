(function (global) {
    class DialogComponent extends HTMLElement {
        constructor() {
            super();

            var scripts;

            const options = {
                $el: '[role="dialog"]',
                alignToEl: document.body,
                align: 'M',
                clone: false,
                draggable: this.hasAttribute('draggable'),
                resizable: this.hasAttribute('resizable')
            };

            const template = document.querySelector('#dialog');
            const content = document.importNode(template.content, true);

            this.root = this.createShadowRoot();
            this.root.appendChild(content);

            options.$el = this.root.querySelector(options.$el);
            scripts = this.root.querySelectorAll('script');

            this.setTitle(this.getAttribute('title'));
            this.setContent(this.innerHTML);

            scripts[scripts.length - 1].onload = () => {
                this.api = new global.Dialog(options);
                this.show();
            };
        }

        show() {
            this.api.show();
        }

        hide() {
            this.api.hide();
        }

        setTitle(title) {
            this.root.querySelector('#title').innerHTML = title;
        }

        setContent(content) {
            this.root.querySelector('#content').innerHTML = content;
        }
    }

    global.customElements.define('dialog-component', DialogComponent);

}(this));