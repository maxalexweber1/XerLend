use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets.{Lovelace, PolicyId, Value, tokens}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}

// pool action
pub type Action {
  //-> Deposit
  Mint(Lovelace, Int)
  //-> Withdraw
  Burn(Lovelace, Int)
}

// pool datum
pub type PoolDatum {
  balance: Lovelace,
  lend_out: Lovelace,
  lp_tokens: Int,
}

// function for extracting the mint quantity
pub fn mint_qty(mint: Value, policy_id: PolicyId) -> Int {
  expect [Pair(_, qty)] =
    mint
      |> tokens(policy_id)
      |> dict.to_pairs()
  qty
}

pub fn calculate_lp_delta(input, pool_datum) {
  expect (balance, lend_out, lp_tokens) = pool_datum
  when lp_tokens is {
    0 -> 0
    _ -> input * lp_tokens / balance
  }
}

// Pool Validator
validator pool {
  // Minting of LP token on deposit
  mint(redeemer action: Action, policy_id: PolicyId, tx: Transaction) {
    let Transaction { mint, input, .. } = tx

    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    when action is {
      Mint(value, lp_amount) -> and {
          amount == lp_amount,
          asset_name == lp_token_name,
        }

      // pool value danach muss gleich aktueller value + input sein
      Burn(_, lp_amount) -> mint_qty(mint, policy_id) == -lp_amount
    }
  }

  // Spend
  spend(
    _datum: Option<PoolDatum>,
    redeemer action: Action,
    o_ref: OutputReference,
    tx: Transaction,
  ) {
    let Transaction { mint, inputs, outputs, .. } = tx
    // Check whether own UTxO is consumed and extract the policy ID
    expect Some(Input {
      output: Output {
        address: this_address,
        value: _pool_input_value,
        datum: InlineDatum(input_datum),
        ..
      },
      output_reference: _,
    }) = list.find(inputs, fn(inp) { inp.output_reference == o_ref })

    expect Script(this_script_hash) = this_address.payment_credential
    let pool_nft_policy = this_script_hash
    let pool_address =
      Address {
        payment_credential: Script(pool_nft_policy),
        stake_credential: None,
      }
    expect PoolDatum {
      balance: input_balance,
      total_lp_tokens: input_lp_tokens,
      lend_out: input_lend_out,
    } = input_datum

    when action is {
      Mint(deposit_amount, lp_tokens_minted) -> {
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect PoolDatum {
                balance: output_balance,
                total_lp_tokens: output_lp_tokens,
              } = output_datum
              and {
                o.address == pool_address,
                output_balance == input_balance + deposit_amount,
                lp_tokens_minted > 0,
                output_lp_tokens == input_lp_tokens + lp_tokens_minted,
                mint_qty(mint, pool_nft_policy) == lp_tokens_minted,
              }
            },
          )
        True
      }
      Burn(withdraw_amount, lp_tokens_burned) -> {
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect PoolDatum {
                balance: output_balance,
                total_lp_tokens: output_lp_tokens,
                lend_out: output_lend_out,
              } = output_datum
              and {
                o.address == pool_address,
                output_balance == input_balance - withdraw_amount,
                lp_tokens_burned > 0,
                input_lp_tokens == output_lp_tokens + lp_tokens_burned,
                output_balance >= 0,
                mint_qty(mint, pool_nft_policy) == -lp_tokens_burned,
              }
            },
          )
        True
      }
    }
  }

  else(_) {
    fail
  }
}

// Tests
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
