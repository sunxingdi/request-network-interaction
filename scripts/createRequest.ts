
import { RequestNetwork, Types, Utils}  from "@requestnetwork/request-client.js";
import { EthereumPrivateKeySignatureProvider } from "@requestnetwork/epk-signature";
import { config } from "dotenv";
import { Wallet } from "ethers";
import { providers } from "ethers";

import { RPC_PROVIDER_URL, PRIVATE_KEY } from "../hardhat.config";

let provider: providers.JsonRpcProvider;

const privateKey = PRIVATE_KEY;

async function main() {

  console.log("\n", "初始化EPK签名...")
  const epkSignatureProvider = new EthereumPrivateKeySignatureProvider({
    method: Types.Signature.METHOD.ECDSA,
    privateKey: privateKey, // PAYEE_PRIVATE_KEY, Must include 0x prefix
  });

  console.log("\n", "初始化请求客户端...")
  const requestClient = new RequestNetwork({
    nodeConnectionConfig: {
      baseURL: "https://goerli.gateway.request.network/",
    },
    signatureProvider: epkSignatureProvider,
  });

  console.log("\n", "定义请求参数...")
  // In this example, the payee is also the payer and payment recipient.
  // const payeeIdentity = new Wallet(privateKey).address; //收款人
  // const payerIdentity = payeeIdentity;                  //付款人

  const payeeIdentity = '0x6BBC4994BFA366B19541a0252148601a9f874cD1'; //收款人
  const payerIdentity = '0x6BBC4994BFA366B19541a0252148601a9f874cD1'; //付款人
  const paymentRecipient = payeeIdentity;               //付款接收者
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
      reason: "i am txn reason...",
      dueDate: "2024.06.16",
    },
    signer: {
      type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
      value: payeeIdentity,
    },
  };

  console.log("\n", "创建请求...")
  const request = await requestClient.createRequest(requestCreateParameters);
  console.log(request.requestId)
  console.log(request.contentData)

  console.log("\n", "等待请求确认...")
  const requestData = await request.waitForConfirmation();
  console.log("\n", "获取请求回执...")
  console.log(JSON.stringify(requestData));

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
