import { Button } from "@heroui/button";
import { PoolDatum } from "../types/pool";
import { useState } from "react";
import {
    Address,
    applyDoubleCborEncoding,
    applyParamsToScript,
    SpendingValidator,
    Constr,
    Data,
    fromText,
    LucidEvolution,
    validatorToAddress,
    MintingPolicy,
    mintingPolicyToId,
    TxSignBuilder,
} from "@lucid-evolution/lucid";

const Script = {
    MintValidator: applyDoubleCborEncoding(
        "59070001010029800aba2aba1aba0aab9faab9eaab9dab9a4888888966003300130033754011370e90014dd2a4001370e90004dc3a40093710900024444453001300d0069806003488c966002601060166ea8006297adef6c6089bab300f300c37540028050c8cc00400400c896600200314c103d87a8000899192cc004cdc8802800c56600266e3c0140062601466022601e00497ae08a60103d87a80004035133004004301300340346eb8c034004c04000500e488c966002600c00313232332259800980a001c01a2c8088dd698088009bad30110023011001300c37540071598009804000c4c8c8cc896600260280070068b2022375a60220026eb4c044008c044004c030dd5001c566002600a00313232332259800980a001c01a2c8088dd698088009bad30110023011001300c3754007164028805100a18051baa00248888c8cc89660026014005132330050021323259800980b800c66002602c00332330010013758602e00644b30010018a508acc004c9660026024602a6ea8006266e3cdd7180c980b1baa0010068b20283018301537546030602a6ea8c060c064c054dd5180c000c528c4cc008008c064005013202c98091baa0049b8f4890a5845524c454e445f4c500048888cc8966002602600913259800cc00401a942945018456600266e1c008dd6980e980f000c56600266e1c008dd6980e800c5660026024005130040038a50406114a080c229410184528203030193754015159800980a80244c8c966002b30013370e6eb4c078c07c008006266e1c00400e294101945660026026007130050048a504065159800803c5660026026007130050048a50406516406480c8dd6980e800980c9baa00a8acc0040162b300133710002900044c00c00a2941017459017202e405c6eb8c058010dd6980b80222c80a0cc01cdd5980a980b180b180b180b00080118089baa007375c602660206ea800e2b3001300c00289919911980380209991194c004dd6180c800cdd5980c980d180d000ccc008dd6180c801919baf301a3017375400200c9112cc004c04cc060dd5000c4c8c966002602860346ea800626644b30013019301c37540031323259800980c980f1baa0048991919192cc004c09c00633001375a604c009375a604c007375a604c005375a604c0032232598009815000c4dd698131814800c590271980d001000c8c09cc0a0c0a000660446ea80512222222598009812000c5284566002604c00313232598009812000c566002604c60566ea8cc0600588c966002604e605a6ea8006264b30013029302e375400313232323259800981b800c56600266ebcc0d8c0ccdd500380ac56600266e1cdd6981b00219b800100098acc004cdc39bad30360023370001c01115980099b87375a606c00601f15980099b87375a606c00201b13370e6601803802c01114a0818a2941031452820628a5040c514a0818a2c81a0c0d8004c0d4004c0d0004c0bcdd5000c5902d181898171baa0018b20583005302d375400314a31640a914a0815166002604a60546ea8042264646464b30013033001899912cc004cdc4800a40011480022b3001302b0028803c4cdc199b8200700200140bc8178dd6981900119b80337006eb4c0c8010dd698190019bad30320018b2060303200130310013030001302b37540211640a46eb4c0b4c0a8dd500dc4c8c96600266e2400520008acc004c098c0acdd51980c00b1192cc004c09cc0b4dd5000c4c9660026052605c6ea8006264646464b300130370018992cc004cdd7981b981a1baa0080168acc004cdc380099b810110098acc004c0b002a2b30013370e01e66e00dd6981b801805456600266e2520000018acc004cdc39bad30370040108acc004cdc39bad303700200e899b873300d01d017337029000005452820648a5040c914a081922941032452820648a5040c914a08190dd6981b002459034181b000981a800981a00098179baa0018b205a3031302e37540031640b0600a605a6ea800629462c8152294102a2cc004c094c0a8dd500844c8c8c8c96600260660031332259800acc004c0ac00a2946266e24005200040bd148002266e0ccdc1003800801205e375a606400466e00cdc01bad3032004375a60640066eb4c0c80062c8180c0c8004c0c4004c0c0004c0acdd50084590291bad302d302e302a3754036814102822c8120c098004c094004c090004c07cdd500245901d180c9981019ba548008cc080dd4800a5eb80cc081300103d87a80004bd701bae3020301d375400316406c603c60366ea8004c078c06cdd5180f001459019180e980f180f000980c9baa301c301d30193754603860326ea80062c80b86032603200460266ea802488c8cc00400400c896600200314c103d87a80008992cc004c010006260266603400297ae0899801801980e001202c301a001406060280026028602a00260206ea800e2c807100e18069baa001301100530103011004229344d9590011"
    ),
    SpendValidator: applyDoubleCborEncoding(
        "59070001010029800aba2aba1aba0aab9faab9eaab9dab9a4888888966003300130033754011370e90014dd2a4001370e90004dc3a40093710900024444453001300d0069806003488c966002601060166ea8006297adef6c6089bab300f300c37540028050c8cc00400400c896600200314c103d87a8000899192cc004cdc8802800c56600266e3c0140062601466022601e00497ae08a60103d87a80004035133004004301300340346eb8c034004c04000500e488c966002600c00313232332259800980a001c01a2c8088dd698088009bad30110023011001300c37540071598009804000c4c8c8cc896600260280070068b2022375a60220026eb4c044008c044004c030dd5001c566002600a00313232332259800980a001c01a2c8088dd698088009bad30110023011001300c3754007164028805100a18051baa00248888c8cc89660026014005132330050021323259800980b800c66002602c00332330010013758602e00644b30010018a508acc004c9660026024602a6ea8006266e3cdd7180c980b1baa0010068b20283018301537546030602a6ea8c060c064c054dd5180c000c528c4cc008008c064005013202c98091baa0049b8f4890a5845524c454e445f4c500048888cc8966002602600913259800cc00401a942945018456600266e1c008dd6980e980f000c56600266e1c008dd6980e800c5660026024005130040038a50406114a080c229410184528203030193754015159800980a80244c8c966002b30013370e6eb4c078c07c008006266e1c00400e294101945660026026007130050048a504065159800803c5660026026007130050048a50406516406480c8dd6980e800980c9baa00a8acc0040162b300133710002900044c00c00a2941017459017202e405c6eb8c058010dd6980b80222c80a0cc01cdd5980a980b180b180b180b00080118089baa007375c602660206ea800e2b3001300c00289919911980380209991194c004dd6180c800cdd5980c980d180d000ccc008dd6180c801919baf301a3017375400200c9112cc004c04cc060dd5000c4c8c966002602860346ea800626644b30013019301c37540031323259800980c980f1baa0048991919192cc004c09c00633001375a604c009375a604c007375a604c005375a604c0032232598009815000c4dd698131814800c590271980d001000c8c09cc0a0c0a000660446ea80512222222598009812000c5284566002604c00313232598009812000c566002604c60566ea8cc0600588c966002604e605a6ea8006264b30013029302e375400313232323259800981b800c56600266ebcc0d8c0ccdd500380ac56600266e1cdd6981b00219b800100098acc004cdc39bad30360023370001c01115980099b87375a606c00601f15980099b87375a606c00201b13370e6601803802c01114a0818a2941031452820628a5040c514a0818a2c81a0c0d8004c0d4004c0d0004c0bcdd5000c5902d181898171baa0018b20583005302d375400314a31640a914a0815166002604a60546ea8042264646464b30013033001899912cc004cdc4800a40011480022b3001302b0028803c4cdc199b8200700200140bc8178dd6981900119b80337006eb4c0c8010dd698190019bad30320018b2060303200130310013030001302b37540211640a46eb4c0b4c0a8dd500dc4c8c96600266e2400520008acc004c098c0acdd51980c00b1192cc004c09cc0b4dd5000c4c9660026052605c6ea8006264646464b300130370018992cc004cdd7981b981a1baa0080168acc004cdc380099b810110098acc004c0b002a2b30013370e01e66e00dd6981b801805456600266e2520000018acc004cdc39bad30370040108acc004cdc39bad303700200e899b873300d01d017337029000005452820648a5040c914a081922941032452820648a5040c914a08190dd6981b002459034181b000981a800981a00098179baa0018b205a3031302e37540031640b0600a605a6ea800629462c8152294102a2cc004c094c0a8dd500844c8c8c8c96600260660031332259800acc004c0ac00a2946266e24005200040bd148002266e0ccdc1003800801205e375a606400466e00cdc01bad3032004375a60640066eb4c0c80062c8180c0c8004c0c4004c0c0004c0acdd50084590291bad302d302e302a3754036814102822c8120c098004c094004c090004c07cdd500245901d180c9981019ba548008cc080dd4800a5eb80cc081300103d87a80004bd701bae3020301d375400316406c603c60366ea8004c078c06cdd5180f001459019180e980f180f000980c9baa301c301d30193754603860326ea80062c80b86032603200460266ea802488c8cc00400400c896600200314c103d87a80008992cc004c010006260266603400297ae0899801801980e001202c301a001406060280026028602a00260206ea800e2c807100e18069baa001301100530103011004229344d9590011"
    ),
};

const spendingValidator: SpendingValidator = {
    type: "PlutusV3",
    script: Script.MintValidator,
};

const poolAddress = validatorToAddress("Preview", spendingValidator);

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

            const depositValue = BigInt(depositAmount);
            const mintingValidator: MintingPolicy = {
                type: "PlutusV3",
                script: Script.MintValidator,
            };

            const policyId = mintingPolicyToId(mintingValidator);
            const assetName = fromText("XERLEND_LP");
            const assetUnit = policyId + assetName;

            const utxosAtPool = await lucid.utxosAt(poolAddress);

            if (utxosAtPool.length === 0) {

                let poolDatum: PoolDatum;

                poolDatum = {
                    balance: depositValue,
                    lp_tokens: depositValue,
                    lend_out: 0n,
                    interest_accrued: 0n,
                };

                const newDatum = new Constr(0, [
                    poolDatum.balance,
                    poolDatum.lp_tokens,
                    poolDatum.lend_out,
                    poolDatum.interest_accrued,
                ]);

                const redeemer = Data.to(new Constr(0, [depositValue, depositValue]));

                console.log("Redeemer:", Data.to(new Constr(0, [depositValue, depositValue])));
                console.log("Datum:", Data.to(newDatum));

                const tx = await lucid
                    .newTx()
                    .mintAssets({ [assetUnit]: depositValue }, redeemer)
                    .pay.ToContract(
                        poolAddress,
                        {
                            kind: "inline",
                            value: Data.to(newDatum),
                        },
                        {
                            lovelace: depositValue,
                        }
                    )
                    .attach.MintingPolicy(mintingValidator)
                    .complete();

                submitTx(tx)
                    .then((result) => {
                        //setActionResult(result);
                        setIsWithdrawModalOpen(false); // Modal schließen
                        setWithdrawAmount(""); // Eingabe zurücksetzen
                    })
                    .catch(onError);

            } else {
                const poolUtxo = utxosAtPool[0];
                const poolInput = [poolUtxo];
                const poolDatumRaw = await lucid.datumOf(poolUtxo);
                const constr = poolDatumRaw as Constr<bigint[]>;
                const [balanceRaw, lpTokensRaw, lendOutRaw, interestAccruedRaw] = constr.fields;

                const balance = balanceRaw as unknown as bigint;
                const lp_tokens = lpTokensRaw as unknown as bigint;
                const lend_out = lendOutRaw as unknown as bigint;
                const interest_accrued = interestAccruedRaw as unknown as bigint;

                const lpMintAmount = (depositValue * lp_tokens) / (balance + lend_out + interest_accrued);

                let poolDatum: PoolDatum;

                poolDatum = {
                    balance: balance + depositValue,
                    lp_tokens: lp_tokens + lpMintAmount,
                    lend_out,
                    interest_accrued,
                };

                const newDatum = new Constr(0, [
                    poolDatum.balance,
                    poolDatum.lp_tokens,
                    poolDatum.lend_out,
                    poolDatum.interest_accrued,
                ]);

                const redeemer = Data.to(new Constr(0, [depositValue, lpMintAmount]));

                const tx = await lucid
                    .newTx()
                    .collectFrom(poolInput)
                    .mintAssets({ [assetUnit]: lpMintAmount }, redeemer)
                    .pay.ToContract(
                        poolAddress,
                        {
                            kind: "inline",
                            value: Data.to(newDatum),
                        },
                        {
                            lovelace: depositValue,
                        }
                    )
                    .attach.MintingPolicy(mintingValidator)
                    .attach.SpendingValidator(mintingValidator)
                    .complete();

                submitTx(tx)
                    .then((result) => {
                        //setActionResult(result);
                        setIsWithdrawModalOpen(false); // Modal schließen
                        setWithdrawAmount(""); // Eingabe zurücksetzen
                    })
                    .catch(onError);
            }
        } catch (error) {
            onError(error);
        }

    }



    async function withdraw() {
        try {
            if (!withdrawAmount || isNaN(Number(withdrawAmount))) {
                throw new Error("Bitte gib eine gültige Menge ein.");
            }
            const mintingValidator: MintingPolicy = { type: "PlutusV3", script: Script.MintValidator };
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



    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="border-2 border-gray-700 rounded-lg p-8 flex flex-col gap-4 items-center w-full max-w-lg bg-blue-300">
                <span className="text-white capitalize text-lg px-18 py-10 text-center">AAA Pool</span>
                <div className="flex flex-wrap gap-4 justify-center">
                    <Button
                        className="bg-blue-700 text-white capitalize text-lg px-8 py-4"
                        radius="full"
                        onPress={() => setIsDepositModalOpen(true)}
                    >
                        Deposit
                    </Button>
                    <Button
                        className="bg-blue-700 text-white capitalize text-lg px-8 py-4"
                        radius="full"
                        onPress={() => setIsWithdrawModalOpen(true)}
                    >
                        Withdraw
                    </Button>
                </div>
                <Button
                    className="bg-blue-700 text-white capitalize text-lg px-8 py-4 opacity-75 cursor-default"
                    radius="full"
                    isDisabled
                >
                    {poolAddress}
                </Button>
            </div>

            {isDepositModalOpen && (
                <div className="fixed inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Deposit Amount</h2>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter amount to deposit"
                            className="w-full p-2 border rounded mb-4 text-white"
                        />
                        <div className="flex gap-4 justify-end">
                            <Button className="bg-blue-700 text-white px-4 py-2 rounded" onPress={() => setIsDepositModalOpen(false)}>
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
                <div className="fixed inset-0 bg-blue-100 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-blue-500 text-white rounded-lg p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Withdraw Amount</h2>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                            className="w-full p-2 border rounded mb-4  text-white"
                        />
                        <div className="flex gap-4 justify-end">
                            <Button className="bg-blue-700 text-white px-4 py-2 rounded" onPress={() => setIsWithdrawModalOpen(false)}>
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