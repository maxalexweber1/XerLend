use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets.{PolicyId}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}
use pool/func.{calculate_lp_mint, calculate_withdraw, mint_qty}
use pool/types.{Burn, InitPool, Mint, PoolAction, PoolDatum}

// Pool Validator
validator pool {
  // Minting of LP token on deposit
  mint(redeemer action: PoolAction, policy_id: PolicyId, tx: Transaction) {
    let Transaction { mint, inputs, .. } = tx

    // check that just one mint action is performed 
    expect [Pair(asset_name, amount)] =
      mint
        |> assets.tokens(policy_id)
        |> dict.to_pairs()

    // check if input is from pool to make sure tokens just minted with protocol reference 
    let from_pool =
      list.any(
        inputs,
        fn(input) {
          expect Script(script_hash) = input.output.address.payment_credential
          script_hash == policy_id
        },
      )

    when action is {
      InitPool(deposit_amount, lp_tokens_minted) -> and {
          !from_pool,
          amount == lp_tokens_minted,
          amount == deposit_amount,
          amount > 0,
          asset_name == "XERLEND_LP",
        }

      Mint(deposit_amount, lp_tokens_minted) ->
        if lp_tokens_minted == deposit_amount && deposit_amount == amount {
          and {
            amount > 0,
            asset_name == "XERLEND_LP",
          }
        } else {
          if from_pool {
            and {
              amount > 0,
              asset_name == "XERLEND_LP",
            }
          } else {
            fail
          }
        }
      Burn(_, _) ->
        if from_pool {
          and {
            amount < 0,
            asset_name == "XERLEND_LP",
          }
        } else {
          fail
        }
    }
  }

  // Spend
  spend(
    _datum: Option<PoolDatum>,
    redeemer action: PoolAction,
    o_ref: OutputReference,
    tx: Transaction,
  ) {
    let Transaction { mint, inputs, outputs, .. } = tx
    // check whether own UTxO is consumed and extract the policy ID
    expect Some(Input {
      output: Output {
        address: this_address,
        value: _pool_input_value,
        datum: InlineDatum(input_datum),
        ..
      },
      output_reference: _,
    }) = list.find(inputs, fn(inp) { inp.output_reference == o_ref })

    // make sure new state allways gos back to own adress
    expect Script(this_script_hash) = this_address.payment_credential
    let pool_nft_policy = this_script_hash
    let pool_address =
      Address {
        payment_credential: Script(pool_nft_policy),
        stake_credential: None,
      }

    // use full PoolDatum record
    expect PoolDatum {
      balance: input_balance,
      lp_tokens: input_lp_tokens,
      lend_out: input_lend_out,
      interest_accrued: input_interest,
    } = input_datum

    when action is {
      InitPool(_, _) -> fail
      Mint(deposit_amount, _) -> {
        let lp_tokens_minted = calculate_lp_mint(deposit_amount, input_datum)
        if lp_tokens_minted > 0 {
          expect Some(_output) =
            list.find(
              outputs,
              fn(o) {
                expect InlineDatum(output_datum) = o.datum
                expect PoolDatum {
                  balance: output_balance,
                  lp_tokens: output_lp_tokens,
                  lend_out: output_lend_out,
                  interest_accrued: output_interest,
                } = output_datum

                and {
                  o.address == pool_address,
                  output_balance == input_balance + deposit_amount,
                  output_lp_tokens == input_lp_tokens + lp_tokens_minted,
                  output_lend_out == input_lend_out,
                  output_interest == input_interest,
                  mint_qty(mint, pool_nft_policy) == lp_tokens_minted,
                }
              },
            )
          True
        } else {
          False
        }
      }
      Burn(_, lp_tokens_burned) -> {
        let withdraw_amount = calculate_withdraw(lp_tokens_burned, input_datum)
        if withdraw_amount <= 0 {
          expect Some(_output) =
            list.find(
              outputs,
              fn(o) {
                expect InlineDatum(output_datum) = o.datum
                expect PoolDatum {
                  balance: output_balance,
                  lp_tokens: output_lp_tokens,
                  lend_out: output_lend_out,
                  interest_accrued: output_interest,
                } = output_datum

                and {
                  o.address == pool_address,
                  output_balance == input_balance - withdraw_amount,
                  lp_tokens_burned > 0,
                  input_lp_tokens == output_lp_tokens + lp_tokens_burned,
                  output_balance >= 0,
                  output_lend_out == input_lend_out,
                  output_interest == input_interest,
                  mint_qty(mint, pool_nft_policy) == -lp_tokens_burned,
                }
              },
            )
          True
        } else {
          False
        }
      }
    }
  }

  else(_) {
    fail
  }
}
