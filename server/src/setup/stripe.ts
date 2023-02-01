import Stripe from "stripe";

// production stripe \/
// export const stripe = new Stripe("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", { apiVersion: "2022-08-01" });
//                   /\


// dev stripe \/
export const stripe = new Stripe("sk_test_51KNlK6LbfOFI72xWf6DWHg7bLESfEQLkCNSY5ohFgH1umLRSIpq68925RA81Codtwhf2mhuqH4Ixe533aoX860nj00bjv2ElfI", { apiVersion: "2022-08-01" });
//            /\