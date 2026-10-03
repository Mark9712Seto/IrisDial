import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: { last: null }, // ultima risposta, per riaprirla
    onCreate() {},
    onDestroy() {},
  }),
)
