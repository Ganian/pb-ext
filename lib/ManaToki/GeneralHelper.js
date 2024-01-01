"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createText = exports.URLBuilder = void 0;
class URLBuilder {
    constructor(base) {
        this.base = base;
        this.params = [];
        this.paths = [];
        this.filterEmptyParamValues = false;
    }
    filterEmptyPramas() {
        this.filterEmptyParamValues = true;
        return this;
    }
    addPath(path) {
        this.paths.push(path);
        return this;
    }
    addParam(key, value) {
        this.params.push({
            key,
            value: value ? value.toString() : '',
        });
        return this;
    }
    build() {
        let url = `${this.base}`;
        if (this.paths.length > 0) {
            url += '/' + this.paths.join('/');
        }
        url = encodeURI(url);
        if (this.params.length > 0) {
            url += '?' + this.params
                .filter((param) => !param.value ||
                !this.filterEmptyParamValues ||
                !param.value)
                .map((param) => encodeURIComponent(param.key) + '=' +
                encodeURIComponent(param.value))
                .join('&');
        }
        return url;
    }
}
exports.URLBuilder = URLBuilder;
// Solely because I'm too lazy to keep writing this every time.
const createText = (text) => createIconText({ text });
exports.createText = createText;
//# sourceMappingURL=GeneralHelper.js.map