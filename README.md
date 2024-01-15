# Request网络交互实践

Request 网络是一个用于存储支付请求的协议。Request 网络解决的核心问题是：区块链交易缺乏交易发生的背景信息。比如说，当一笔交易发生时，可以看到交易的发送地址、接收地址等信息，但是不知道这笔交易的背景、原因和目的，这正是 Request 网络中存储的内容。

### 原理说明

Request 网络在区块链交易的基础上进行封装，增加contentData用于记录交易背景。

- 创建请求：收款人创建一个支付请求，包含付款人、收款人、支付金额等信息。
- 更新请求：创建请求后，可以更新请求，比如修改支付金额。
- 支付请求：付款人支付一个请求。
- 检索请求：支付完成后，可按付款人或收款人检索请求信息。

使用场景：
将交易原始凭证进行数字化存储，可以自动生成记账凭证。自动出具审计报告、税务报告、财务报表等。

### 脚本说明

创建请求

```shell
npx hardhat run .\scripts\createRequest.ts --network goerli
```

创建请求+支付请求

```shell
npx hardhat run .\scripts\payRequest.ts --network goerli
```

检索请求

```shell
npx hardhat run .\scripts\payRequest.ts --network goerli
```

### 参考文档

[DappLearning分享会回顾：Request Network](https://mp.weixin.qq.com/s/sVPhqFiWVR2eUDZCU0I-mA)

[Request Network官方文档](https://docs.request.network/)
