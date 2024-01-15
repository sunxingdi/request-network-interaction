import { RequestNetwork, Types } from "@requestnetwork/request-client.js";

async function main() {
    const requestClient = new RequestNetwork({
        nodeConnectionConfig: {
            baseURL: "https://goerli.gateway.request.network/",
        },
    });

    const identity = "0x6BBC4994BFA366B19541a0252148601a9f874cD1";
    const requests = await requestClient.fromIdentity({
        type: Types.Identity.TYPE.ETHEREUM_ADDRESS,
        value: identity,
    });
    const requestDatas = requests.map((request) => request.getData());
    console.log(JSON.stringify(requestDatas));
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });