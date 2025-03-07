import {
    Address,
    LucidEvolution,
    UTxO,
} from '@lucid-evolution/lucid';


interface DashboardProps {
    lucid: LucidEvolution;
    address: Address;
    utxos: UTxO[] | null; // UTXOs passed as props
    onError: (error: any) => void;
}

export default function Dashboard(props: DashboardProps) {
    const { lucid, address, utxos, onError } = props;

    return (
        <div className="flex flex-col gap-2">
            <span>{address}</span>
            <div>
                <h3>UTXOs:</h3>
                <ul>
                    {utxos?.map((utxo, index) => (
                        <li key={index} className="border p-2 my-2">
                            <p>Tx Hash: {utxo.txHash}</p>
                            <p>Output Index: {utxo.outputIndex}</p>
                            <p>Address: {utxo.address}</p>

                            {/* Falls das UTxO Assets besitzt, werden diese ausgegeben */}
                            {utxo.assets && (
                                <div>
                                    <h4>Assets:</h4>
                                    <ul>
                                        {Object.entries(utxo.assets).map(([asset, amount]) => (
                                            <li key={asset}>
                                                {asset}: {amount.toString()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}