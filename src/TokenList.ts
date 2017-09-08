import {ParserNode, DataNode, InstructionNode} from "./TokenNode";
import {TOKEN_TYPE} from "./Tokenizer";
type tokenlistArray = Array<ParserNode | DataNode | InstructionNode>;
export class TokenList {
    private _list:tokenlistArray;

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
    getItem(number)
    {
        return this._list[number];
    }

    // expect a specified sequence
    // eg. WORD OPR COMMA OPR
    // return matching tokens
    // if keep is true, only return true/false
    // and tokens are not consumed
    expect(expectedTypes: (TOKEN_TYPE|Array<TOKEN_TYPE>|Array<Array<TOKEN_TYPE>>), keep = false) {
        let result;
        if (expectedTypes instanceof Array) {
            let match = (this.getLength() != 0);
            let cur;
            let optionalOK;
            let n = expectedTypes.length;
            // list too short, no need to compare
            if (n > this._list.length) return result;
            // comparation
            for (let i = 0; i < n; i++) {
               let cur = expectedTypes[i];
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
    expectList(Element_Type_Or_Types: (TOKEN_TYPE | TOKEN_TYPE[]), Separator_Type: TOKEN_TYPE) {
        let result = [];
        if (Element_Type_Or_Types instanceof Array) {
            for (let expectme of Element_Type_Or_Types) {
                let cur = this.expect(expectme);
                if (cur) {
                    result.push(cur.value);
                    while ((cur = this.expect([Separator_Type, expectme])) != undefined) {
                        result.push(cur[1].value);
                    }
                }
            }
        } else {
            let cur = this.expect(Element_Type_Or_Types);
            if (cur) {
                result.push(cur.value);
                while ((cur = this.expect([Separator_Type, Element_Type_Or_Types])) != undefined) {
                    result.push(cur[1].value);
                }
            }
        }
        return result;
    }
}