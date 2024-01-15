import {RequestNetwork,Types,Utils,} from "@requestnetwork/request-client.js";
import {EthereumPrivateKeySignatureProvider,}  from  "@requestnetwork/epk-signature";
import {approveErc20,hasSufficientFunds,hasErc20Approval,payRequest,} from "@requestnetwork/payment-processor";
import { providers, Wallet } from "ethers";
// import { config }  from "dotenv";

import { RPC_PROVIDER_URL, PRIVATE_KEY } from "../hardhat.config";

// const privateKey = PRIVATE_KEY;
const PAYEE_PRIVATE_KEY = PRIVATE_KEY;
const PAYER_PRIVATE_KEY = PRIVATE_KEY;

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function main() {

    console.log("\n", "初始化EPK签名...")
    const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
        method: Types.Signature.METHOD.ECDSA,
        privateKey: PAYEE_PRIVATE_KEY, // Must include 0x prefix
      });
    
    console.log("\n", "初始化请求客户端...")
    const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://goerli.gateway.request.network/",
        },
        signatureProvider: epkSignatureProvider,
    });

    console.log("\n", "定义请求参数...")
    // const payeeIdentity = new Wallet(PRIVATE_KEY).address;
    // const payerIdentity = payeeIdentity;

    const payeeIdentity = '0x6BBC4994BFA366B19541a0252148601a9f874cD1'; //收款人
    const payerIdentity = '0x6BBC4994BFA366B19541a0252148601a9f874cD1'; //付款人

    const paymentRecipient = payeeIdentity; //付款接收者
    const feeRecipient = "0x0000000000000000000000000000000000000000";

    const requestCreateParameters = {
        requestInfo: {
            currency: {
            type: Types.RequestLogic.CURRENCY.ERC20,
            value: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F", //goerli USDC
            network: "goerli",
            },
            expectedAmount: "100000", //0.1 USDC, decimals = 6
            payee: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: payeeIdentity,
            },
            payer: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: payerIdentity,
            },
            timestamp: Utils.getCurrentTimestampInSecond(),
        },
        paymentNetwork: {
            id: Types.Extension.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
            parameters: {
            paymentNetworkName: "goerli",
            paymentAddress: paymentRecipient,
            feeAddress: feeRecipient,
            feeAmount: "0",
            },
        },
        contentData: {
            reason: "i am txn reason2...",
            dueDate: "2023.06.16",
        },
        signer: {
            type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
            value: payeeIdentity,
        },
    };

    console.log("\n", "创建请求...")
    const request = await requestClient.createRequest(requestCreateParameters);

    /**
     * TODO: 此处抛异常，原因未知
     * Error: Transaction confirmation not received. Try polling
     *      getTransactionsByChannelId() until the transaction is confirmed.
     *      deferDelay: 3000ms,
     *      maxRetries: 30,
     *      retryDelay: 1000ms,
     *      exponentialBackoffDelay: 0ms,
     *      maxExponentialBackoffDelay: 30000ms
     * at E:\Code\request-network-interaction\node_modules\@requestnetwork\request-client.js\src\http-data-access.ts:132:19
     * at processTicksAndRejections (node:internal/process/task_queues:95:5)
     * 
     */

    console.log("\n", "延时等待 10 分钟（600000 毫秒）...")
    await delay(600000);

    console.log("\n", "等待请求确认...")
    let requestData = await request.waitForConfirmation();
    // try {
    //     let requestData = await request.waitForConfirmation();
    //     console.log(`Created Request: ${JSON.stringify(requestData)}`);
    // } catch (error) {
    //     console.log("\n", "等待超时...")
    //     console.error("捕获到异常:", error);
    // }

    console.log(`Created Request: ${JSON.stringify(requestData)}`);
    console.log("\n", "初始化付款者钱包...")
    const provider = new providers.JsonRpcProvider(RPC_PROVIDER_URL);
    const payerWallet = new Wallet(PAYER_PRIVATE_KEY, provider,);

    console.log("\n", "检查付款者钱包余额是否充足...")
    console.log(
    `Checking if payer ${payerWallet.address} has sufficient funds...`,
    );
    const _hasSufficientFunds = await hasSufficientFunds(
    requestData,
    payerWallet.address,
    {
        provider: provider,
    },
    );
    console.log(`_hasSufficientFunds = ${_hasSufficientFunds}`);
    if (!_hasSufficientFunds) {
    throw new Error(`Insufficient Funds: ${payerWallet.address}`);
    }

    console.log("\n", "检查付款者是否已授权转账...")
    console.log(
    `Checking if payer ${payerWallet.address} has sufficient approval...`,
    );
    const _hasErc20Approval = await hasErc20Approval(
        requestData,
        payerWallet.address,
        provider,
    );
    console.log(`_hasErc20Approval = ${_hasErc20Approval}`);
    if (!_hasErc20Approval) {
        console.log("\n", "付款者未授权转账，正在授权...")
        console.log(`Requesting approval...`);
        const approvalTx = await approveErc20(requestData, payerWallet);
        await approvalTx.wait(2);
        console.log(`Approval granted. ${approvalTx.hash}`);
    }

    console.log("\n", "正在支付请求...")
    const paymentTx = await payRequest(requestData, payerWallet);
    await paymentTx.wait(2);
    console.log(`Payment complete. ${paymentTx.hash}`);

    console.log("\n", "等待支付到账...")
    let startTime = Date.now();
    while (requestData.balance?.balance < requestData.expectedAmount) {
        requestData = await request.refresh();
        console.log(`current balance = ${requestData.balance?.balance}`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Check if 5 seconds have passed, and if so, break out of the loop
        if (Date.now() - startTime >= 5000) {
            console.log("Timeout: Exiting loop after 5 seconds.");
            break;
        }
    }

}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});