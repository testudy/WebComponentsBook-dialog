(function (global) {
    var template = document.querySelector('#dialog');
    global.DialogTemplate = templateFactory(template, 'Dialog', {
        $el: '[role="dialog"]',
    });
}(this));