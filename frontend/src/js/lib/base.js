
export class BaseView {

    initialize(wrapper) {

        this.wrapper = wrapper;

        var width = this.width = (wrapper.offsetWidth === 0) ? wrapper.parentNode.offsetWidth : wrapper.offsetWidth;
        var height = this.height = 0.8*width;

        wrapper.style.height = height + 'px';

    }

}
