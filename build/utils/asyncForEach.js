"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// helper function that makes sure the array is indeed processed async
async function asyncForEach(array, callback) {
    let index = 0;
    const ar = array.length;
    for (; index < ar; index++) {
        await callback(array[index], index, array);
    }
}
exports.default = asyncForEach;
