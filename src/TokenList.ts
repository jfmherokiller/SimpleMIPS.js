import {TokenNode,ParserNode,DataNode,InstructionNode} from "./TokenNode";

export class TokenList {
    private _list:(TokenNode|ParserNode|DataNode|InstructionNode)[];

    constructor() {
        this._list = [];
    }

    getLength() {
        return this._list.length;
    }

    getList() {
        return this._list;
    }

    push(...items) {
        return this._list.push(items[0]);
    }

    prepend(list) {
        this._list = list.concat(this._list);
    }

    // expect a specified sequence
    // eg. WORD OPR COMMA OPR
    // return matching tokens
    // if keep is true, only return true/false
    // and tokens are not consumed
    expect(expectedTypes, keep = false) {
        let result;
        if (expectedTypes instanceof Array) {
            let match = (this._list.length != 0);
            let cur;
            let optionalOK;
            let n = expectedTypes.length;
            // list too short, no need to compare
            if (n > this._list.length) return result;
            // comparation
            for (let i = 0; i < n; i++) {
                cur = expectedTypes[i];
                if (cur instanceof Array) {
                    // deal with optional types
                    optionalOK = false;
                    for (let j = 0; j < cur.length; j++) {
                        optionalOK = optionalOK || (this._list[i].type == cur[j]);
                    }
                    if (!optionalOK) {
                        match = false;
                        break;
                    }
                } else {
                    // deal with strict type
                    if (this._list[i].type != cur) {
                        match = false;
                        break;
                    }
                }
            }
            if (match) {
                if (keep) {
                    result = true;
                } else {
                    result = this._list.splice(0, n);
                }
            }
        } else if (this._list[0] && this._list[0].type == expectedTypes) {
            if (keep) {
                result = true;
            } else {
                result = this._list.splice(0, 1)[0];
            }
        }
        return result;
    }

    // expect a constant list
    // eg. 12, 23, 23
    // return an Array of list items
    expectList(eleType, sepType) {
        let result = [];
        let cur = this.expect(eleType);
        if (cur) {
            result.push(cur.value);
            while ((cur = this.expect([sepType, eleType])) != undefined) {
                result.push(cur[1].value);
            }
            return result;
        } else {
            return undefined;
        }
    }
}