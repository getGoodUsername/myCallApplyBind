/* eslint-disable no-extend-native, max-len */

'use strict';

Function.prototype.myCall = function myCall(thisArg, ...args)
{
    const functionToBeCalled = this;
    if (thisArg == null) return functionToBeCalled(...args);

    const functionToBeCalledPropertyNameSymbol = Symbol('functionToBeCalledPropertyNameSymbol');
    const proxyThisArg = (() =>
    {
        const getFirstExtensibleObj = (obj) =>
        {
            let result = obj;
            while (!Object.isExtensible(result) && result != null)
            {
                result = Object.getPrototypeOf(result);
            }
            return result;
        };
        return getFirstExtensibleObj(thisArg);
    })();
    const addFunctionToBeCalledToObj = (obj) =>
    {
        Object.defineProperties(obj, {
            [functionToBeCalledPropertyNameSymbol]: { value: functionToBeCalled, configurable: true },
        });
        return obj;
    };

    if (proxyThisArg != null)
    {
        addFunctionToBeCalledToObj(proxyThisArg);
        const result = thisArg[functionToBeCalledPropertyNameSymbol](...args);
        delete proxyThisArg[functionToBeCalledPropertyNameSymbol];
        return result;
    }

    // make a clone of passed in thisArg; it is not extensible so just emulate
    // thisArg.
    const propDescriptorsThisArg = Object.getOwnPropertyDescriptors(thisArg);
    const shallowCloneThisArg = (() =>
    {
        const extensibleShallowCloneThisArg = Object.create(Object.getPrototypeOf(thisArg), propDescriptorsThisArg);
        addFunctionToBeCalledToObj(extensibleShallowCloneThisArg);
        return Object.preventExtensions(extensibleShallowCloneThisArg); // done to emulate thisArg behavior
    })();

    const result = shallowCloneThisArg[functionToBeCalledPropertyNameSymbol](...args);
    delete shallowCloneThisArg[functionToBeCalledPropertyNameSymbol]; // avoid copying over to thisArg
    Object.defineProperties(thisArg, Object.getOwnPropertyDescriptors(shallowCloneThisArg)); // copy over any modifications
    // might be able to use a proxy object (https://javascript.info/proxy) instead of a shallow clone
    // and do it so only the objects that are modified are copied over to the original passed in
    // thisArg
    return result;
};

Function.prototype.myBind = function myBind(thisArg)
{
    return (...args) => this.myCall(thisArg, ...args);
};

Function.prototype.myApply = function myApply(thisArg, argArray = [])
{
    return this.myCall(thisArg, ...argArray);
};
