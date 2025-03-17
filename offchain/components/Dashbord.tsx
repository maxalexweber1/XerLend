import { Button } from "@heroui/button";
import { useState } from "react";
import {
    Address,
    applyDoubleCborEncoding,
    applyParamsToScript,
    Constr,
    Data,
    fromText,
    LucidEvolution,
    MintingPolicy,
    mintingPolicyToId,
    TxSignBuilder,
} from "@lucid-evolution/lucid";

const Script = {
    MintAlwaysTrue: applyDoubleCborEncoding(
        "58b801010032323232323232323225333003323232323253330083370e900018051baa0011325333333010003153330093370e900018059baa0031533300d300c37540062944020020020020020020dd7180698059baa00116300c300d003300b002300a002300a001300637540022930a998022491856616c696461746f722072657475726e65642066616c73650013656153300249010f5f72656465656d65723a20566f696400165734ae7155ceaab9e5573eae855d12ba41"
    ),
};

export default function Dashboard(props: {
    lucid: LucidEvolution;
    address: Address;
    onError: (error: any) => void;
}) {
    const { lucid, address, onError } = props;

    // Zustand für das Popup
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    async function submitTx(tx: TxSignBuilder) {
        const txSigned = await tx.sign.withWallet().complete();
        const txHash = await txSigned.submit();
        return txHash;
    }

    async function deposit() {
        try {
            if (!depositAmount || isNaN(Number(depositAmount))) {
                throw new Error("Bitte gib eine gültige Menge ein.");
            }
            const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintAlwaysTrue };
            const policyID = mintingPolicyToId(mintingValidator);
            const assetName = "Always True Token";
            const mintedAssets = { [`${policyID}${fromText(assetName)}`]: BigInt(depositAmount) };
            const redeemer = Data.void();

            const tx = await lucid
                .newTx()
                .mintAssets(mintedAssets, redeemer)
                .attach.MintingPolicy(mintingValidator)
                .attachMetadata(721, {
                    [policyID]: {
                        [assetName]: {
                            name: assetName,
                            image: "https://avatars.githubusercontent.com/u/1",
                        },
                    },
                })
                .complete();

            submitTx(tx)
                .then((result) => {
                    //setActionResult(result);
                    setIsDepositModalOpen(false); // Modal schließen
                    setDepositAmount(""); // Eingabe zurücksetzen
                })
                .catch(onError);
        } catch (error) {
            onError(error);
        }
    }

    async function withdraw() {
        try {
            if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
                throw new Error("Bitte gib eine gültige Menge ein.");
            }
            const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintAlwaysTrue };
            const policyID = mintingPolicyToId(mintingValidator);
            const assetName = "Always True Token";
            const assetUnit = `${policyID}${fromText(assetName)}`;
            const burnedAssets = { [assetUnit]: -BigInt(withdrawAmount) };
            const redeemer = Data.void();

            const utxos = await lucid.utxosAtWithUnit(address, assetUnit);
            const tx = await lucid
                .newTx()
                .collectFrom(utxos)
                .mintAssets(burnedAssets, redeemer)
                .attach.MintingPolicy(mintingValidator)
                .complete();

            submitTx(tx)
                .then((result) => {
                    //setActionResult(result);
                    setIsWithdrawModalOpen(false); // Modal schließen
                    setWithdrawAmount(""); // Eingabe zurücksetzen
                })
                .catch(onError);
        } catch (error) {
            onError(error);
        }
    }

    const poolAddress = "pool1exampleaddress1234567890abcdefg";

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="border-2 border-gray-300 rounded-lg p-8 flex flex-col gap-4 items-center w-full max-w-lg bg-blue-100">
                <span className="text-center">AAA Pool</span>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button
                        className="bg-blue-500 text-white shadow-lg capitalize text-lg px-8 py-4"
                        radius="full"
                        onPress={() => setIsDepositModalOpen(true)}
                    >
                        Deposit
                    </Button>
                    <Button
                        className="bg-blue-500 text-white shadow-lg capitalize text-lg px-8 py-4"
                        radius="full"
                        onPress={() => setIsWithdrawModalOpen(true)}
                    >
                        Withdraw
                    </Button>
                </div>
                <Button
                    className="bg-blue-500 text-white shadow-lg capitalize text-lg px-8 py-4 opacity-75 cursor-default"
                    radius="full"
                    isDisabled
                >
                    {poolAddress}
                </Button>
            </div>

            {/* Deposit Modal */}
            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Deposit Amount</h2>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter amount to deposit"
                            className="w-full p-2 border rounded mb-4 text-black"
                        />
                        <div className="flex gap-4 justify-end">
                            <Button className="bg-blue-300 text-black px-4 py-2 rounded" onPress={() => setIsDepositModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-blue-700 text-white px-4 py-2 rounded" onPress={deposit}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {isWithdrawModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Withdraw Amount</h2>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                            className="w-full p-2 border rounded mb-4 text-black"
                        />
                        <div className="flex gap-4 justify-end">
                            <Button className="bg-blue-300 text-black px-4 py-2 rounded" onPress={() => setIsWithdrawModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-blue-700 text-white px-4 py-2 rounded" onPress={withdraw}>
                                Confirm
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}