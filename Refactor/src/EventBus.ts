export class EventBus {
    _bus;
    constructor()
    {
        this._bus = {}
    }
    // register an event handler
    register(ename, handler) {
        if (!this._bus[ename]) {
            this._bus[ename] = [handler];
        } else {
            this._bus[ename].push(handler);
        }
    }
    // remove an event handler
    remove(ename, handler) {
        let list = this._bus[ename];
        if (list) {
            list.splice(list.indexOf(handler), 1);
        }
    }
    // post an event, following arguments will be
    // passed to handlers
    post(ename) {
        let args = Array.prototype.slice.call(arguments, 1),
            list = this._bus[ename];
        if (list) {
            let n = list.length;
            for (let i= 0; i < n; i++) {
                list[i].apply(null, args);
            }
        }
    }

}