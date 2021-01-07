const PENDING = 'pending'
const FULFILLED = "fulfilled"
const REJECTED = "rejected"

function Promise (excutor) {
  const that = this
  that.status = PENDING
  that.value = undefined
  that.reason = undefined
  that.onFulfilledCallbacks = []
  that.onRejectedCallbacks = []
  function resolve (value) {
    if (value instanceof Promise) {
      return value.then(resolve, reject)
    }
    setTimeout(() => {
      if (that.status === PENDING) {
        that.status = FULFILLED
        that.value = value
        that.onFulfilledCallbacks.forEach((p)=>p(that.value))
      }
    })
  }

  function reject (reason) {
    setTimeout(() => {
      if (that.status === PENDING) {
        that.status = REJECTED
        that.reason = reason
        that.onRejectedCallbacks.forEach((p)=>p(that.reason))
      }
    })
  }
  try {
    excutor(resolve, reject)
  } catch (e) {
    reject(e)
  }
}

Promise.prototype.then = function(onFulfilled, onRejected) {
  const that = this
  let newPromise
  onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (val) => val
  onRejected = typeof onRejected === 'function' ? onRejected : (val) => { throw val }
  if (that.status === FULFILLED) {
      return newPromise = new Promise(function(resolve, reject) {
        setTimeout(() => {
          try {
            let x = onFulfilled(that.value)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
    })
  } 
  if (that.status === REJECTED) {
      return newPromise = new Promise(function(resolve, reject) {
        setTimeout(() => {
          try {
            let x = onRejected(that.reason)
            resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
    })
  }
  if (that.status === PENDING) {
    return newPromise = new Promise(function(resolve, reject) {
      that.onFulfilledCallbacks.push((value)=>{
        try {
          let x = onFulfilled(value)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
      that.onRejectedCallbacks.push((reason)=>{
        try {
          let x = onRejected(reason)
          resolvePromise(newPromise, x, resolve, reject)
        } catch (e) {
          reject(e)
        }
      })
    })
  }
}

function resolvePromise(newPromise, x, resolve, reject) {
  if(newPromise === x) {
    return reject(new TypeError('1'))
  }
  let off = false
  if (x != null && ((typeof x === 'object') || (typeof x === 'function'))){
    try {
      let thenable = x.then
      if(typeof thenable === 'function') {
        thenable.call(x, function(v) {
          if(off) return;
          off = true;
          resolvePromise(newPromise, v, resolve, reject)
        }, function(reason) {
          if(off) return;
          off = true;
          reject(reason)
      })
      } else {
        resolve(x)
      }
    } catch (e) {
      if(off) return;
      off = true;
      reject(e)
    }
  } else {
    resolve(x)
  }
  
}

Promise.race = function (promiseArr) {
  return new Promise(function(resolve, reject) {
    promiseArr.forEach((prom) => {
      prom.then(resolve, reject)
    })
  })
}

Promise.all = function(promiseArr) {
  const arr = []
  return new Promise(function(resolve, reject) {
    promiseArr.forEach((prom) => {
        prom.then(function(v){
          arr.push(v)
          if(arr.length === promiseArr.length) {
            resolve(arr)
          }
        }, reject)
    })
  })
}

function lenRes(len, cur, resolve) {
  if(len === cur.length){
    resolve(cur)
  }
}

Promise.allSettled = function (promiseArr) {
  const arr = []
  return new Promise(function(resolve, _) {
    promiseArr.forEach((prom) => {
      prom.then(function() {
        arr.push({
          status: prom.status,
          value: prom.value
        })
        lenRes(promiseArr.length, arr, resolve)
      }, function(r) {
        arr.push({
          status: prom.status,
          value: prom.reason
        })
        lenRes(promiseArr.length, arr, resolve)
      })
    })
  })
}

Promise.resolve = function (res) {
  return new Promise(function(resolve, _) {
    resolve(res)
  })
}
Promise.reject = function (res) {
  return new Promise(function(_, reject) {
    reject(res)
  })
}

Promise.prototype.catch = function (rej) {
  return this.then(null, rej)
}

Promise.prototype.finally = function (f) {
  return this.then((val) => {
    f()
    return val
  }, (val) => {
    f()
    return val
  })
}

Promise.deferred = function() { // 延迟对象
  let defer = {};
  defer.promise = new Promise((resolve, reject) => {
      defer.resolve = resolve;
      defer.reject = reject;
  });
  return defer;
}

try {
  module.exports = Promise
} catch (e) {
}
