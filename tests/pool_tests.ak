use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets.{Lovelace, PolicyId, Value, tokens}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use validators/pool.{PoolDatum}

test deposit() {
  let pool_hash = #"d1510f9836f5fbc5c0822d109582b7d2fdabe8de2bb8b81bb0c62f8c"
  let pool_address =
    Address { payment_credential: Script(pool_hash), stake_credential: None }
  let initial_datum = PoolDatum { balance: 0, total_lp_tokens: 0 }
  let redeemer = Mint(1_000_000, 1_000_000)
  let input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: #"abc123",
        output_index: 0,
      },
      output: Output {
        address: pool_address,
        value: assets.from_lovelace(0),
        datum: InlineDatum(initial_datum),
        reference_script: None,
      },
    }
  let output_utxo =
    Output {
      address: pool_address,
      value: assets.from_lovelace(1_000_000)
        |> assets.merge(assets.from_asset(pool_hash, #"6e6674", 1_000_000)),
      datum: InlineDatum(
        PoolDatum { balance: 1_000_000, total_lp_tokens: 1_000_000 },
      ),
      reference_script: None,
    }
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [input_utxo],
      outputs: [output_utxo],
      mint: assets.from_asset(pool_hash, #"6e6674", 1_000_000),
    }
  pool.spend(
    Some(initial_datum),
    redeemer,
    OutputReference { transaction_id: #"abc123", output_index: 0 },
    tx,
  ) && pool.mint(redeemer, pool_hash, tx)
}

test withdraw() {
  let pool_hash = #"d1510f9836f5fbc5c0822d109582b7d2fdabe8de2bb8b81bb0c62f8c"
  let pool_address =
    Address { payment_credential: Script(pool_hash), stake_credential: None }
  let initial_datum =
    PoolDatum { balance: 1_000_000, total_lp_tokens: 1_000_000 }
  let redeemer = Burn(500_000, 500_000)
  let input_utxo =
    Input {
      output_reference: OutputReference {
        transaction_id: #"def456",
        output_index: 0,
      },
      output: Output {
        address: pool_address,
        value: assets.from_lovelace(1_000_000)
          |> assets.merge(assets.from_asset(pool_hash, #"6e6674", 1_000_000)),
        datum: InlineDatum(initial_datum),
        reference_script: None,
      },
    }
  let output_utxo =
    Output {
      address: pool_address,
      value: assets.from_lovelace(500_000)
        |> assets.merge(assets.from_asset(pool_hash, #"6e6674", 500_000)),
      datum: InlineDatum(
        PoolDatum { balance: 500_000, total_lp_tokens: 500_000 },
      ),
      reference_script: None,
    }
  let tx =
    Transaction {
      ..transaction.placeholder,
      inputs: [input_utxo],
      outputs: [output_utxo],
      mint: assets.from_asset(pool_hash, #"6e6674", -500_000),
    }
  pool.spend(
    Some(initial_datum),
    redeemer,
    OutputReference { transaction_id: #"def456", output_index: 0 },
    tx,
  )
}
