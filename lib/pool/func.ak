use aiken/collection/dict
use aiken/collection/list
use cardano/assets.{PolicyId, Value, tokens}
use cardano/transaction.{Input, OutputReference}
use pool/types.{PoolDatum}

// function for extracting the mint quantity
pub fn mint_qty(mint: Value, policy_id: PolicyId) -> Int {
  expect [Pair(_, qty)] =
    mint
      |> tokens(policy_id)
      |> dict.to_pairs()
  qty
}

/// Calculates how many LP tokens should be minted for a given ADA deposit.
/// Considers the full pool value including lend_out and accrued interest.
/// If the pool is in an invalid state (e.g. total_value <= 0), returns 0.
pub fn calculate_lp_mint(deposit: Int, pool_datum: Data) -> Int {
  expect PoolDatum { balance, lp_tokens, lend_out, interest_accrued } =
    pool_datum

  let total_value = balance + lend_out + interest_accrued

  if total_value <= 0 {
    // Invalid pool state — minting is not allowed
    0
  } else if lp_tokens == 0 {
    // First depositor receives 1:1 LP tokens
    deposit
  } else {
    // Proportional LP token minting based on current total pool value
    deposit * lp_tokens / total_value
  }
}

/// Calculates how much ADA a user can withdraw for a given amount of LP tokens burned.
/// Based on the user's share of the total pool value including lend_out and interest.
pub fn calculate_withdraw(lp_burned: Int, pool_datum: Data) -> Int {
  expect PoolDatum { balance, lp_tokens, lend_out, interest_accrued } =
    pool_datum

  let total_value = balance + lend_out + interest_accrued

  if lp_tokens == 0 || total_value <= 0 {
    0
  } else {
    // Proportional ADA withdrawal based on share of total pool value
    lp_burned * total_value / lp_tokens
  }
}

pub fn consume_utxo(
  transaction_inputs: List<Input>,
  output_reference: OutputReference,
) -> Bool {
  let transaction_input <- list.any(transaction_inputs)
  transaction_input.output_reference == output_reference
}
