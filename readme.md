# koishi-plugin-cs2-tools

[![npm](https://img.shields.io/npm/v/koishi-plugin-cs2-tools?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-cs2-tools)

# 当前功能

- 使用Buff登录来获取你的库存信息
## 使用方法

私聊机器人使用指令“绑定账号” 根据提示进行账号绑定

群聊或私聊使用指令“查看库存”来查看当前库存，默认价格降序显示前20个饰品

查看库存后，可以在30秒内使用“检视 <序号>”来获取你想要的武器的游戏内检视链接，输入在浏览器即可在游戏内检视，从左到右，从上到下排序，使用-p 参数指定页数
## 更新日志
- **1.0.4** 修复不带-p参数时无法正常使用的bug

- **1.0.3** 更改获取刷新库存的逻辑，增加可选库存页数，在查看库存时使用-p 参数

- **1.0.2** 修复页面不完全加载与prompt超时的错误提示问题

- **1.0.1** 增加查看库存下可以获取检视链接功能