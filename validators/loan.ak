use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Address, Script}
use cardano/assets.{Lovelace, PolicyId, Value, tokens}
use cardano/transaction.{
  InlineDatum, Input, Output, OutputReference, Transaction,
}

// Risk rating enumeration
pub type RiskRating {
  AAA
  AA
  A
  BBB
  BB
  B
  CCC
}

// Collateral Datum: Represents the state of a secured loan
pub type CollateralDatum {
  collateral: Int,
  risk_rating: RiskRating,
  borrowed: Int,
  health_factor: Int,
  loan_duration: Int,
}

// Actions for the collateral & loan contract
pub type Action {
  // Deposit additional collateral along with an updated risk rating.
  Deposit(Int, RiskRating)
  // Borrow a specified amount of ADA.
  Borrow(Int)
  // Repay a specified amount of the outstanding loan.
  Repay(Int)
  // Trigger liquidation if the health factor is below the safe threshold.
  Liquidate
}

// Helper function to calculate the maximum loan amount based on collateral_value and risk rating.
pub fn max_loan_amount(collateral_value: Lovelace, risk: RiskRating) -> Lovelace {
  when risk is {
    AAA -> collateral_value * 80 / 100
    AA -> collateral_value * 75 / 100
    A -> collateral_value * 70 / 100
    BBB -> collateral_value * 65 / 100
    BB -> collateral_value * 60 / 100 / 100
    B -> collateral_value * 50 / 100
    CCC -> collateral_value * 40 / 100
  }
}

// Collateral & Loan Validator
validator collateralLoan {
  spend(
    _datum: Option<CollateralDatum>,
    redeemer action: Action,
    o_ref: OutputReference,
    tx: Transaction,
  ) {
    // Extract the input UTxO being spent
    let Transaction { inputs, outputs, .. } = tx
    expect Some(Input {
      output: Output {
        address: this_address,
        value: _loan_input_value,
        datum: InlineDatum(input_datum),
        ..
      },
      output_reference: _,
    }) = list.find(inputs, fn(inp) { inp.output_reference == o_ref })
    expect CollateralDatum {
      collateral: input_collateral,
      risk_rating: input_risk,
      borrowed: input_borrowed,
      health_factor: input_health,
      loan_duration: input_duration,
    } = input_datum

    when action is {
      Deposit(deposit_amt, new_risk) -> {
        // Update the collateral amount and risk rating. Other values remain unchanged.
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect CollateralDatum {
                collateral: output_collateral,
                risk_rating: output_risk,
                borrowed: output_borrowed,
                health_factor: output_health,
                loan_duration: output_duration,
              } = output_datum
              and {
                o.address == this_address,
                output_collateral == input_collateral + deposit_amt,
                output_risk == new_risk,
                output_borrowed == input_borrowed,
                // Health factor and duration may remain unchanged or be recalculated off-chain.
                output_health == input_health,
                output_duration == input_duration,
              }
            },
          )
        True
      }
      Borrow(borrow_amt) -> {
        // Calculate the maximum allowable loan based on collateral and risk rating.
        let allowed = max_loan_amount(input_collateral, input_risk)
        // Ensure that the total borrowed (existing + new) does not exceed the allowed maximum.
        expect input_borrowed + borrow_amt <= allowed
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect CollateralDatum {
                collateral: output_collateral,
                risk_rating: output_risk,
                borrowed: output_borrowed,
                health_factor: output_health,
                loan_duration: output_duration,
              } = output_datum
              and {
                o.address == this_address,
                output_collateral == input_collateral,
                output_risk == input_risk,
                output_borrowed == input_borrowed + borrow_amt,
                // The Health Factor may be updated here based on the new borrow amount.
                output_health == input_health,
                output_duration == input_duration,
              }
            },
          )
        True
      }
      Repay(repay_amt) -> {
        // Validate that the repayment does not exceed the borrowed amount.
        expect repay_amt <= input_borrowed
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect CollateralDatum {
                collateral: output_collateral,
                risk_rating: output_risk,
                borrowed: output_borrowed,
                health_factor: output_health,
                loan_duration: output_duration,
              } = output_datum
              and {
                o.address == this_address,
                output_collateral == input_collateral,
                output_risk == input_risk,
                output_borrowed == input_borrowed - repay_amt,
                // Optionally, if the loan is fully repaid, the health factor could be reset.
                output_health == input_health,
                output_duration == input_duration,
              }
            },
          )
        True
      }
      Liquidate -> {
        // Liquidation is permitted only if the Health Factor has fallen below a critical threshold (e.g., < 1.0).
        expect input_health < 1
        // Upon liquidation, the borrowed amount must be fully cleared.
        expect Some(_output) =
          list.find(
            outputs,
            fn(o) {
              expect InlineDatum(output_datum) = o.datum
              expect CollateralDatum {
                collateral: output_collateral,
                risk_rating: output_risk,
                borrowed: output_borrowed,
                health_factor: output_health,
                loan_duration: output_duration,
              } = output_datum
              and {
                o.address == this_address,
                // The output datum should reflect that the loan is repaid (borrowed == 0)
                output_borrowed == 0,
              }
            },
          )
        // Other state transitions (e.g., transferring collateral to a liquidation address)
        // would be handled as part of a broader liquidation mechanism.
        True
      }
    }
  }

  else(_) {
    fail
  }
}
