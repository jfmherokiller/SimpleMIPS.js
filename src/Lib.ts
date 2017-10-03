export class Lib {
    // add methods
    static methods(obj, fns) {
        if (typeof(obj) == 'function') {
            Lib.extend(obj.prototype, fns);
        } else {
            Lib.extend(obj, fns);
        }
    }

    static padLeft(str, chr, len) {
        let n = len - str.length;
        if (n <= 0) return str;
        for (let i = 0; i < n; i++) {
            str = chr + str;
        }
        return str;
    }
    static padRight(str, chr, len) {
        let n = len - str.length;
        if (n <= 0) return str;
        for (let i = 0; i < n; i++) {
            str = str + chr;
        }
        return str;
    }

    static extend(src, obj, obj2?) {
        if (obj2) {
            // merge 3
            for (let key1 in obj2) {
                obj[key1] = obj2[key1];
            }
            for (let key2 in obj) {
                src[key2] = obj[key2];
            }
        } else {
            // merge 2
            for (let key in obj) {
                src[key] = obj[key];
            }
            return src;
        }
    }

// find overlapped elements
    static overlap(arr1, arr2) {
        let i, j,
            m = arr1.length,
            n = arr2.length,
            result = [];
        for (i = 0; i < n; i++) {
            for (j = 0; j < m; j++) {
                if (arr1[i] == arr2[j]) {
                    result.push(arr1[i]);
                }
            }
        }
        return result;
    }
    //twos compliment
    static TwosCompliment(MyNumber){
        return (~MyNumber + 1 >>> 0);
    }
}